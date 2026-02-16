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
  
  if (message.action === 'findZoomInfoLink') {
    findZoomInfoLink().then(data => sendResponse(data));
    return true;
  }

  if (message.action === 'findZoomInfoEmployeeDirectoryLink') {
    findZoomInfoEmployeeDirectoryLink().then(data => sendResponse(data));
    return true;
  }

  if (message.action === 'scrapeZoomInfoEmployeeDirectoryZip') {
    scrapeZoomInfoEmployeeDirectoryZip().then(data => sendResponse(data));
    return true;
  }
});

async function findZoomInfoLink() {
  try {
    console.log('Searching for ZoomInfo link on:', window.location.href);
    
    // Find all links to zoominfo.com
    const zoomInfoLinks = Array.from(document.querySelectorAll('a[href*="zoominfo.com"]'));
    console.log(`Found ${zoomInfoLinks.length} ZoomInfo links`);
    
    // Filter for company profile links (exclude login, search, etc)
    const companyLinks = zoomInfoLinks.filter(link => {
      const href = link.href;
      return href.includes('/c/') || href.includes('/company/');
    });
    
    console.log(`Found ${companyLinks.length} company profile links`);
    
    if (companyLinks.length > 0) {
      const firstLink = companyLinks[0].href;
      console.log('✓ Found ZoomInfo company link:', firstLink);
      return { zoomInfoUrl: firstLink };
    }
    
    // Fallback: use any zoominfo link
    if (zoomInfoLinks.length > 0) {
      const firstLink = zoomInfoLinks[0].href;
      console.log('✓ Using first ZoomInfo link:', firstLink);
      return { zoomInfoUrl: firstLink };
    }
    
    console.log('✗ No ZoomInfo links found');
    return { zoomInfoUrl: null };
  } catch (error) {
    console.error('Error finding ZoomInfo link:', error);
    return { zoomInfoUrl: null };
  }
}

async function findZoomInfoEmployeeDirectoryLink() {
  try {
    console.log('Searching for ZoomInfo employee directory link on:', window.location.href);

    const zoomInfoLinks = Array.from(document.querySelectorAll('a[href*="zoominfo.com"]'));
    console.log(`Found ${zoomInfoLinks.length} ZoomInfo links`);

    // Prefer employee directory links
    const employeeLinks = zoomInfoLinks.filter(link => {
      const href = link.href.toLowerCase();
      return href.includes('employee') || href.includes('directory');
    });

    if (employeeLinks.length > 0) {
      const firstLink = employeeLinks[0].href;
      console.log('✓ Found ZoomInfo employee directory link:', firstLink);
      return { zoomInfoEmployeeDirectoryUrl: firstLink };
    }

    // Fallback: any ZoomInfo link
    if (zoomInfoLinks.length > 0) {
      const firstLink = zoomInfoLinks[0].href;
      console.log('✓ Using first ZoomInfo link as fallback:', firstLink);
      return { zoomInfoEmployeeDirectoryUrl: firstLink };
    }

    console.log('✗ No ZoomInfo employee directory links found');
    return { zoomInfoEmployeeDirectoryUrl: null };
  } catch (error) {
    console.error('Error finding ZoomInfo employee directory link:', error);
    return { zoomInfoEmployeeDirectoryUrl: null };
  }
}

async function scrapeZoomInfoEmployeeDirectoryZip() {
  try {
    console.log('Scraping ZoomInfo employee directory zip from:', window.location.href);

    const subtitle = document.querySelector('p.subTitle');
    if (subtitle) {
      const text = subtitle.textContent || '';
      console.log('Found subtitle text:', text);

      // Extract last 4-6 digit postal code from the sentence
      const matches = text.match(/\b\d{4,6}\b/g);
      const zipCode = matches && matches.length > 0 ? matches[matches.length - 1] : '';
      if (zipCode) {
        console.log('✓ Extracted zip code:', zipCode);
        return { zipCode };
      }
    }

    console.log('✗ Zip code not found in subtitle');
    return { zipCode: '' };
  } catch (error) {
    console.error('Error scraping employee directory zip:', error);
    return { zipCode: '' };
  }
}

async function scrapeZoomInfo() {
  const data = {
    phone: '',
    headquarters: '',
    employees: '',
    revenue: '',
    industry: ''
  };
  
  try {
    console.log('========================================');
    console.log('ZOOMINFO SCRAPER RUNNING');
    console.log('Current URL:', window.location.href);
    console.log('Page title:', document.title);
    console.log('========================================');
    
    // Check if we're on ZoomInfo
    if (!window.location.href.includes('zoominfo.com')) {
      console.warn('⚠ NOT on ZoomInfo page! Currently on:', window.location.hostname);
    }
    
    // Extract EMPLOYEES from company-header-subtitle
    console.log('Looking for employees...');
    const subtitleEl = document.querySelector('.company-header-subtitle');
    if (subtitleEl) {
      const text = subtitleEl.textContent;
      console.log('Found subtitle text:', text);
      // Extract employees like "10K+ Employees" or "5000 Employees"
      const empMatch = text.match(/(\d+[KM]?\+?)\s*Employees/i);
      if (empMatch) {
        data.employees = empMatch[1];
        console.log('✓ Found employees:', data.employees);
      }
    } else {
      console.log('✗ Employees not found');
    }
    
    // Extract PHONE NUMBER from icon-text-container
    console.log('Looking for phone...');
    const labels = document.querySelectorAll('h3.icon-label');
    for (const label of labels) {
      if (label.textContent.includes('Phone Number')) {
        const contentSpan = label.parentElement.querySelector('span.content');
        if (contentSpan) {
          data.phone = contentSpan.textContent.trim();
          console.log('✓ Found phone:', data.phone);
          break;
        }
      }
    }
    if (!data.phone) console.log('✗ Phone not found');
    
    // Extract HEADQUARTERS from icon-text-container
    console.log('Looking for headquarters...');
    for (const label of labels) {
      if (label.textContent.includes('Headquarters')) {
        const contentSpan = label.parentElement.querySelector('span.content');
        if (contentSpan) {
          data.headquarters = contentSpan.textContent.trim();
          console.log('✓ Found HQ:', data.headquarters);
          break;
        }
      }
    }
    if (!data.headquarters) console.log('✗ Headquarters not found');
    
    // Extract REVENUE from icon-text-container
    console.log('Looking for revenue...');
    for (const label of labels) {
      if (label.textContent.includes('Revenue')) {
        const contentSpan = label.parentElement.querySelector('span.content');
        if (contentSpan) {
          data.revenue = contentSpan.textContent.trim();
          console.log('✓ Found revenue:', data.revenue);
          break;
        }
      }
    }
    if (!data.revenue) console.log('✗ Revenue not found');

    // Extract INDUSTRY chips from company-chips-wrapper (e.g. Healthcare Services, Manufacturing, Pharmaceuticals)
    console.log('Looking for industry...');
    const industryLabel = Array.from(labels).find(label =>
      (label.textContent || '').trim().toLowerCase() === 'industry'
    );
    if (industryLabel) {
      const industryContainer = industryLabel.parentElement?.querySelector('#company-chips-wrapper') ||
        document.querySelector('#company-chips-wrapper');

      if (industryContainer) {
        const chipLinks = Array.from(industryContainer.querySelectorAll('a.record-link, a.link'));
        const industries = chipLinks
          .map(link => (link.textContent || '').trim())
          .filter(Boolean);

        if (industries.length > 0) {
          data.industry = industries.join(', ');
          console.log('✓ Found industry:', data.industry);
        }
      }
    }
    if (!data.industry) {
      const fallbackIndustryText = document.querySelector('#company-chips-wrapper')?.textContent?.trim() || '';
      if (fallbackIndustryText) {
        data.industry = fallbackIndustryText.replace(/\s+/g, ' ');
        console.log('✓ Found industry (fallback):', data.industry);
      } else {
        console.log('✗ Industry not found');
      }
    }
    
    console.log('========================================');
    console.log('FINAL ZOOMINFO DATA:', data);
    console.log('========================================');
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
    
    // FALLBACK: Look for actual email address
    let emailEl = document.querySelector('a[href^="mailto:"]');
    if (emailEl) {
      const href = emailEl.getAttribute('href');
      const emailMatch = href.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        data.email = emailMatch[0];
        console.log('✓ Found actual email:', data.email);
        return data;
      }
    }
    
    // FALLBACK: Search in page text for email
    const allText = document.body.innerText;
    const emailMatches = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches && emailMatches.length > 0) {
      data.email = emailMatches[0];
      console.log('✓ Found email in page text:', data.email);
      return data;
    }
    
    console.log('No email found on page');
  } catch (error) {
    console.error('Error scraping RocketReach:', error);
  }
  
  return data;
}
