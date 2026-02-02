// Scraper content script for Google, ZoomInfo, RocketReach
console.log('Scraper loaded on:', window.location.hostname);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scrapeZoomInfo') {
    scrapeZoomInfo().then(data => sendResponse(data));
    return true;
  }
  
  if (message.action === 'scrapeRocketReach') {
    scrapeRocketReach(message).then(data => sendResponse(data));
    return true;
  }
});

async function scrapeZoomInfo() {
  const data = {
    phone: '',
    headquarters: '',
    employees: '',
    revenue: ''
  };
  
  try {
    console.log('Scraping ZoomInfo from:', window.location.href);
    
    // Try to find phone number
    let phoneEl = document.querySelector('[data-test-id="phone"]') || 
                  document.querySelector('.company-phone') ||
                  document.querySelector('a[href^="tel:"]') ||
                  document.querySelector('[class*="phone"]');
    if (phoneEl) {
      const text = phoneEl.textContent || phoneEl.getAttribute('href');
      data.phone = text.trim();
      console.log('Found phone:', data.phone);
    }
    
    // Try to find headquarters/address
    let hqEl = document.querySelector('[data-test-id="headquarters"]') ||
               document.querySelector('.company-hq') ||
               document.querySelector('[class*="address"]') ||
               document.querySelector('[class*="headquarters"]');
    if (hqEl) {
      data.headquarters = hqEl.textContent.trim();
      console.log('Found HQ:', data.headquarters);
    }
    
    // Try to find employees count
    let empEl = document.querySelector('[data-test-id="employees"]') ||
                document.querySelector('[class*="employee"]') ||
                document.querySelector('[class*="company-size"]');
    if (empEl) {
      const text = empEl.textContent.trim();
      const match = text.match(/\d+\s*-?\s*\d+/);
      data.employees = match ? match[0] : text;
      console.log('Found employees:', data.employees);
    }
    
    // Try to find revenue
    let revEl = document.querySelector('[data-test-id="revenue"]') ||
                document.querySelector('[class*="revenue"]') ||
                document.querySelector('[class*="annual"]');
    if (revEl) {
      const text = revEl.textContent.trim();
      data.revenue = text;
      console.log('Found revenue:', data.revenue);
    }
    
    console.log('ZoomInfo scraped data:', data);
  } catch (error) {
    console.error('Error scraping ZoomInfo:', error);
  }
  
  return data;
}

async function scrapeRocketReach(message) {
  const data = { email: '' };
  const { domain = '', firstName = '', lastName = '' } = message;
  
  try {
    console.log('Scraping RocketReach from:', window.location.href);
    console.log('CSV data received:', { firstName, lastName, domain });
    
    // ★ PRIORITY 1: Build email from CSV names - THIS IS MOST IMPORTANT
    if (firstName && lastName && domain) {
      // Extract clean domain (without https://, www, etc)
      let cleanDomain = domain.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      console.log('✓ Using domain from CSV:', cleanDomain);
      
      // Build email with actual names from CSV
      const constructedEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanDomain}`;
      data.email = constructedEmail;
      console.log('✓✓ BUILT EMAIL FROM CSV NAMES:', constructedEmail);
      return data;
    }
    
    console.log('⚠ No CSV names provided, searching page for email...');
    
    // FALLBACK: Look for actual email address on page
    let emailEl = document.querySelector('a[href^="mailto:"]');
    if (emailEl) {
      const href = emailEl.getAttribute('href');
      const emailMatch = href.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        data.email = emailMatch[0];
        console.log('Found email in mailto link:', data.email);
        return data;
      }
    }
    
    // FALLBACK: Search in page text for email
    const allText = document.body.innerText;
    const emailMatches = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches && emailMatches.length > 0) {
      data.email = emailMatches[0];
      console.log('Found email in page text:', data.email);
      return data;
    }
    
    console.log('No email found on page');
  } catch (error) {
    console.error('Error scraping RocketReach:', error);
  }
  
  return data;
}
