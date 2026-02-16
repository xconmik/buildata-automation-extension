chrome.runtime.onInstalled.addListener(() => {
  console.log('Buildata Automation Extension installed.');
});

// Helper function for delays
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Serialize background actions to avoid overlapping scrapes
const actionQueues = {};
function enqueueAction(key, fn) {
  actionQueues[key] = (actionQueues[key] || Promise.resolve()).then(fn, fn);
  return actionQueues[key];
}

// Prevent duplicate concurrent runs for the same key
const inFlight = new Map();
function runSingleFlight(key, fn) {
  if (inFlight.has(key)) {
    return inFlight.get(key);
  }
  const promise = Promise.resolve().then(fn).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

// Simple cache to reuse recent scrape results
const scrapeCache = {
  zoomInfo: new Map(),
  rocketReach: new Map()
};
const CACHE_TTL_MS = 2 * 60 * 1000;
function getCached(map, key) {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    map.delete(key);
    return null;
  }
  return entry.data;
}
function setCached(map, key, data) {
  map.set(key, { ts: Date.now(), data });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scrapeZoomInfo') {
    const key = `scrapeZoomInfo:${message.domain || ''}`;
    enqueueAction('scrapeZoomInfo', () => runSingleFlight(key, () => scrapeZoomInfoData(message.domain))).then(data => {
      sendResponse(data);
    }).catch(error => {
      sendResponse({ phone: '', headquarters: '', employees: '', revenue: '', industry: '', zoomInfoUrl: '' });
    });
    return true;
  }
  
  if (message.action === 'scrapeRocketReach') {
    const key = `scrapeRocketReach:${message.domain || ''}:${message.firstName || ''}:${message.lastName || ''}`;
    enqueueAction('scrapeRocketReach', () => runSingleFlight(key, () => scrapeRocketReachData(message.domain, message.firstName, message.lastName))).then(data => {
      sendResponse(data);
    }).catch(error => {
      sendResponse({ email: '' });
    });
    return true;
  }
  
  if (message.action === 'searchZipCode') {
    enqueueAction('searchZipCode', () => searchZipCodeGoogle(message.street, message.city, message.state)).then(zipCode => {
      sendResponse({ zipCode });
    }).catch(error => {
      sendResponse({ zipCode: '' });
    });
    return true;
  }

  if (message.action === 'searchZipFromEmployeeDirectory') {
    enqueueAction('searchZipFromEmployeeDirectory', () => searchZipFromEmployeeDirectory(message.domain)).then(zipCode => {
      sendResponse({ zipCode });
    }).catch(error => {
      sendResponse({ zipCode: '' });
    });
    return true;
  }
  
  if (message.action === 'fillBuildataForm') {
    // Find the Buildata tab specifically, not just the active tab
    chrome.tabs.query({url: '*://buildata.pharosiq.com/*'}, async (tabs) => {
      try {
        if (!tabs || tabs.length === 0) {
          sendResponse({status: 'error', message: 'Buildata tab not found. Please open buildata.pharosiq.com'});
          return;
        }
        
        const buildataTab = tabs[0];
        
        // Make sure the tab is active so form filling works
        await chrome.tabs.update(buildataTab.id, { active: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Inject content script only if not already loaded
        let isContentReady = false;
        try {
          const ping = await chrome.tabs.sendMessage(buildataTab.id, { action: 'ping' });
          isContentReady = !!(ping && ping.status === 'ready');
        } catch (e) {
          isContentReady = false;
        }
        if (!isContentReady) {
          await chrome.scripting.executeScript({
            target: {tabId: buildataTab.id},
            files: ['content.js']
          });
        }
        
        // Send message to content script
        chrome.tabs.sendMessage(buildataTab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({status: 'error', message: chrome.runtime.lastError.message});
          } else {
            sendResponse(response || {status: 'success'});
          }
        });
      } catch (e) {
        console.error('Error:', e);
        sendResponse({status: 'error', message: e.message});
      }
    });
    return true;
  }
});

async function scrapeZoomInfoData(domain) {
  if (!domain) return { phone: '', headquarters: '', employees: '', revenue: '', industry: '', zoomInfoUrl: '' };

  const cacheKey = domain.toLowerCase();
  const cached = getCached(scrapeCache.zoomInfo, cacheKey);
  if (cached) {
    console.log('Using cached ZoomInfo data for:', domain);
    return cached;
  }
  
  const scrapedData = { phone: '', headquarters: '', employees: '', revenue: '', industry: '', zoomInfoUrl: '' };
  
  try {
    console.log('=== Starting ZoomInfo scrape for domain:', domain);
    // Open Google search for ZoomInfo
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(domain)}+zoominfo`;
    console.log('Opening search:', searchUrl);
    const searchTab = await chrome.tabs.create({ url: searchUrl, active: false });
    
    // Wait for Google search to load
    console.log('Waiting for Google search to load...');
    await sleep(4000);
    
    // Try to find and click ZoomInfo link
    try {
      console.log('Looking for ZoomInfo link in search results...');
      const result = await chrome.tabs.sendMessage(searchTab.id, { action: 'findZoomInfoLink' });
      console.log('Result from findZoomInfoLink:', result);
      
      if (result && result.zoomInfoUrl) {
        console.log('✓ Found ZoomInfo URL:', result.zoomInfoUrl);
        scrapedData.zoomInfoUrl = result.zoomInfoUrl;
        
        // Navigate to the ZoomInfo page
        await chrome.tabs.update(searchTab.id, { url: result.zoomInfoUrl });
        console.log('Navigating to ZoomInfo page...');
        await sleep(6000); // Wait longer for ZoomInfo page to fully load
        
        // Now scrape the ZoomInfo page
        console.log('Scraping ZoomInfo page...');
        const data = await chrome.tabs.sendMessage(searchTab.id, { action: 'scrapeZoomInfo' });
        console.log('Received data from ZoomInfo:', data);
        
        if (data && (data.phone || data.headquarters || data.employees || data.revenue || data.industry)) {
          Object.assign(scrapedData, data);
          console.log('✓ ZoomInfo scraping complete:', scrapedData);
        } else {
          console.log('⚠ ZoomInfo returned empty data');
        }
      } else {
        console.log('✗ No ZoomInfo link found in search results');
      }
    } catch (e) {
      console.log('✗ Could not scrape ZoomInfo:', e.message);
      console.error('Full error:', e);
    }
    
    // Close tab
    await chrome.tabs.remove(searchTab.id);
    
  } catch (error) {
    console.error('Error scraping ZoomInfo:', error);
  }
  
  if (scrapedData && (scrapedData.phone || scrapedData.headquarters || scrapedData.employees || scrapedData.revenue || scrapedData.industry)) {
    setCached(scrapeCache.zoomInfo, cacheKey, scrapedData);
  } else if (cached) {
    console.log('ZoomInfo scrape empty; falling back to cached data.');
    return cached;
  }

  console.log('Returning ZoomInfo data:', scrapedData);
  return scrapedData;
}

async function scrapeRocketReachData(domain, firstName, lastName) {
  if (!domain) return { email: '' };
  
  const scrapedData = { email: '' };
  const cacheKey = `${domain.toLowerCase()}|${(firstName || '').toLowerCase()}|${(lastName || '').toLowerCase()}`;
  const cached = getCached(scrapeCache.rocketReach, cacheKey);
  if (cached) {
    console.log('Using cached RocketReach data for:', cacheKey);
    return cached;
  }
  
  try {
    console.log('=== Starting RocketReach scrape for domain:', domain);
    // Open Google search for RocketReach
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(domain)}+rocketreach+email`;
    console.log('Opening search tab:', searchUrl);
    const tab = await chrome.tabs.create({ url: searchUrl, active: false });
    
    // Wait for page to load
    await sleep(4000);
    
    // Try to scrape RocketReach data
    try {
      const data = await chrome.tabs.sendMessage(tab.id, { 
        action: 'scrapeRocketReach',
        domain,
        firstName,
        lastName
      });
      Object.assign(scrapedData, data);
      console.log('✓ RocketReach scraped successfully:', scrapedData);
    } catch (e) {
      console.log('✗ Could not scrape RocketReach from tab:', e.message);
    }
    
    // Close tab
    await chrome.tabs.remove(tab.id);
    
  } catch (error) {
    console.error('Error scraping RocketReach:', error);
  }

  // Fallback: construct email if RocketReach returned nothing
  if (!scrapedData.email && firstName && lastName) {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
    const constructedEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanDomain}`;
    scrapedData.email = constructedEmail;
    console.log('✓ Built email fallback:', constructedEmail);
  }
  
  if (scrapedData && scrapedData.email) {
    setCached(scrapeCache.rocketReach, cacheKey, scrapedData);
  } else if (cached) {
    console.log('RocketReach scrape empty; falling back to cached data.');
    return cached;
  }

  return scrapedData;
}

async function scrapeDataForLead(domain) {
  const scrapedData = {
    phone: '',
    headquarters: '',
    employees: '',
    revenue: '',
    email: ''
  };
  
  try {
    // Open ZoomInfo in new tab
    const zoomTab = await chrome.tabs.create({
      url: `https://www.google.com/search?q=${encodeURIComponent(domain)}+zoominfo`,
      active: false
    });
    
    // Wait for page to load
    await sleep(3000);
    
    // Try to scrape ZoomInfo data
    try {
      const zoomData = await chrome.tabs.sendMessage(zoomTab.id, { action: 'scrapeZoomInfo' });
      Object.assign(scrapedData, zoomData);
    } catch (e) {
      console.log('Could not scrape ZoomInfo:', e);
    }
    
    // Open RocketReach in new tab
    const rocketTab = await chrome.tabs.create({
      url: `https://www.google.com/search?q=${encodeURIComponent(domain)}+rocketreach+email`,
      active: false
    });
    
    // Wait for page to load
    await sleep(3000);
    
    // Try to scrape RocketReach data
    try {
      const rocketData = await chrome.tabs.sendMessage(rocketTab.id, { action: 'scrapeRocketReach' });
      Object.assign(scrapedData, rocketData);
    } catch (e) {
      console.log('Could not scrape RocketReach:', e);
    }
    
    // Close scraping tabs
    chrome.tabs.remove([zoomTab.id, rocketTab.id]);
    
  } catch (error) {
    console.error('Error during scraping:', error);
  }
  
  return scrapedData;
}

// Search ZoomInfo employee directory for zip code
async function searchZipFromEmployeeDirectory(domain) {
  if (!domain) return '';

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const searchQuery = `${cleanDomain} zoominfo employee directory`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    console.log('Searching ZoomInfo employee directory:', searchQuery);

    const searchTab = await chrome.tabs.create({ url: searchUrl, active: false });
    await sleep(4000);

    let zipCode = '';

    try {
      const linkResult = await chrome.tabs.sendMessage(searchTab.id, { action: 'findZoomInfoEmployeeDirectoryLink' });
      const targetUrl = linkResult?.zoomInfoEmployeeDirectoryUrl;

      if (targetUrl) {
        await chrome.tabs.update(searchTab.id, { url: targetUrl });
        await sleep(6000);

        const zipResult = await chrome.tabs.sendMessage(searchTab.id, { action: 'scrapeZoomInfoEmployeeDirectoryZip' });
        zipCode = zipResult?.zipCode || '';
        console.log('✓ Zip from employee directory:', zipCode);
      } else {
        console.log('✗ No ZoomInfo employee directory link found in search results');
      }
    } catch (e) {
      console.log('✗ Error scraping ZoomInfo employee directory:', e.message);
    }

    await chrome.tabs.remove(searchTab.id);
    return zipCode;
  } catch (error) {
    console.error('Error searching ZoomInfo employee directory zip:', error);
    return '';
  }
}

// Search Google for zip code dynamically
async function searchZipCodeGoogle(street, city, state) {
  let searchTab = null;
  try {
    const searchQuery = `${street} ${city} ${state} what is the zip code`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Searching for zip code:', searchQuery);
    
    // Create a new tab for searching
    searchTab = await new Promise((resolve, reject) => {
      chrome.tabs.create({ url: googleSearchUrl, active: false }, (tab) => {
        if (tab) resolve(tab);
        else reject(new Error('Could not create search tab'));
      });
    });
    
    // Wait for page to load
    await sleep(3000);
    
    const codeResult = await chrome.scripting.executeScript({
      target: { tabId: searchTab.id },
      func: () => {
        const text = (document.body && document.body.innerText) ? document.body.innerText : '';
        const patterns = [
          /Postal Code[\s:]*([0-9]{4,6})/i,
          /(?:ZIP|Zip Code)[\s:]*([0-9]{5}(?:-[0-9]{4})?)/i,
          /\b([A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/i,
          /\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/i,
          /\b([0-9]{4,6})\b/
        ];

        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return String(match[1]).trim();
          }
        }

        return '';
      }
    });

    const zipCode = codeResult?.[0]?.result || '';
    console.log('Found zip code from Google result page:', zipCode);

    console.log('Final zip code extracted:', zipCode);
    return zipCode;
    
  } catch (error) {
    console.error('Error searching for zip code:', error);
    return '';
  } finally {
    if (searchTab && searchTab.id) {
      try {
        await chrome.tabs.remove(searchTab.id);
      } catch {
        // no-op if tab already closed
      }
    }
  }
}
