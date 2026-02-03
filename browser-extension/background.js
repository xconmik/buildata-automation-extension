chrome.runtime.onInstalled.addListener(() => {
  console.log('Buildata Automation Extension installed.');
});

// Helper function for delays
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scrapeZoomInfo') {
    scrapeZoomInfoData(message.domain).then(data => {
      sendResponse(data);
    }).catch(error => {
      sendResponse({ phone: '', headquarters: '', employees: '', revenue: '', zoomInfoUrl: '' });
    });
    return true;
  }
  
  if (message.action === 'scrapeRocketReach') {
    scrapeRocketReachData(message.domain, message.firstName, message.lastName).then(data => {
      sendResponse(data);
    }).catch(error => {
      sendResponse({ email: '' });
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
        
        // Inject content script if needed
        await chrome.scripting.executeScript({
          target: {tabId: buildataTab.id},
          files: ['content.js']
        });
        
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
  if (!domain) return { phone: '', headquarters: '', employees: '', revenue: '', zoomInfoUrl: '' };
  
  const scrapedData = { phone: '', headquarters: '', employees: '', revenue: '', zoomInfoUrl: '' };
  
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
        
        if (data && (data.phone || data.headquarters || data.employees || data.revenue)) {
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
  
  console.log('Returning ZoomInfo data:', scrapedData);
  return scrapedData;
}

async function scrapeRocketReachData(domain, firstName, lastName) {
  if (!domain) return { email: '' };
  
  const scrapedData = { email: '' };
  
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
