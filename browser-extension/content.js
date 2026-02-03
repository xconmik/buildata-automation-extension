// Content script for Buildata automation
console.log('Buildata Automation Extension content script loaded.');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({status: 'ready'});
    return true;
  }
  
  if (message.action === 'fillBuildataForm') {
    fillBuildataForm(message.data).then(() => {
      sendResponse({status: 'done'});
    }).catch((error) => {
      console.error('Fill error:', error);
      sendResponse({status: 'error', message: error.message});
    });
    return true; // Keep channel open for async response
  }
});

// Helper: find button by partial text match (case-insensitive)
function findButtonByText(textPart) {
  return Array.from(document.querySelectorAll('button')).find(btn =>
    btn.textContent.toUpperCase().includes(textPart.toUpperCase())
  );
}

// Helper: find input by label text (case-insensitive)
function findInputByLabel(labelText) {
  const labels = Array.from(document.querySelectorAll('label'));
  const label = labels.find(l => l.textContent.toUpperCase().includes(labelText.toUpperCase()));
  if (label && label.htmlFor) {
    return document.getElementById(label.htmlFor);
  }
  return null;
}

// Helper: handle modal OK (or other) button if it appears
async function handleModalIfAppears(buttonText = 'OK') {
  const modalOkBtn = Array.from(document.querySelectorAll('button')).find(btn =>
    btn.textContent.trim() === buttonText && btn.closest('.modal-content')
  );
  if (modalOkBtn) {
    console.log(`⚠️ Modal appeared - clicking ${buttonText} button`);
    modalOkBtn.click();
    await sleep(1000);
  }
}

async function fillBuildataForm(data) {
  console.log('=== FILLING FORM WITH DATA ===');
  console.log('Campaign Name received:', data.campaignName);
  console.log('Full data:', data);
  window.__buildataAutoButtonsEnabled = data.autoButtonsEnabled !== false;
  
  // Parse name
  const firstLast = (data['First Name, Last Name'] || data.firstNameLastName || '').split(/,| /).map(s => s.trim()).filter(Boolean);
  const firstName = firstLast[0] || '';
  const lastName = firstLast.length > 1 ? firstLast[firstLast.length - 1] : '';
  
  // LinkedIn URL formatting
  let linkedinUrl = data['Company Linkedin URL'] || data.companyLinkedIn || '';
  if (linkedinUrl && !/\/about\/?$/.test(linkedinUrl)) {
    linkedinUrl = linkedinUrl.replace(/\/+$/, '') + '/about';
  }
  
  // Domain formatting - add https:// prefix
  let domain = data['Domain or Website'] || data.domain || '';
  if (domain) {
    domain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    domain = 'https://' + domain;
  }
  
  // Use scraped data (already obtained before form fill)
  const scrapedPhone = data.scrapedPhone || '';
  const scrapedHeadquarters = data.scrapedHeadquarters || '';
  const scrapedEmployees = data.scrapedEmployees || '';
  const scrapedRevenue = data.scrapedRevenue || '';
  const scrapedEmail = data.scrapedEmail || '';
  
  // Parse headquarters string into address components dynamically
  // Handles formats like:
  // - "Street Address, City, State, ZipCode, Country"
  // - "Street Address, City, State, ZipCode"
  // - "Street Address, City, State"
  let scrapedStreetAddress = '';
  let scrapedCity = '';
  let scrapedState = '';
  let scrapedZipCode = '';
  
  if (scrapedHeadquarters) {
    console.log('Parsing headquarters dynamically:', scrapedHeadquarters);
    
    // Remove trailing "..." if present (truncation indicator from ZoomInfo)
    let hqClean = scrapedHeadquarters.replace(/\.\.\.$/, '').trim();
    console.log('Cleaned headquarters:', hqClean);
    
    const parts = hqClean.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    console.log('Parts found:', parts, 'Count:', parts.length);
    
    // Detect country from the last part (if present)
    const lastPart = parts[parts.length - 1]?.toUpperCase() || '';
    const countryDetected = lastPart.length > 2 && lastPart.match(/^[A-Z\s]+$/) ? lastPart : null;
    
    // Dynamic zip pattern based on country
    let zipPatterns = [
      /^\d{4,5}$/,  // Default: 4-5 digits (Germany, Austria, Switzerland)
    ];
    
    if (countryDetected) {
      console.log('Country detected:', countryDetected);
      
      // Country-specific zip patterns
      const zipPatternMap = {
        'US': /^\d{5}(?:-\d{4})?$/,           // US: 12345 or 12345-6789
        'USA': /^\d{5}(?:-\d{4})?$/,
        'UK': /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,  // UK: SW1A 1AA
        'UNITED KINGDOM': /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
        'CA': /^[A-Z]\d[A-Z]\s\d[A-Z]\d$/i,  // Canada: K1A 0B1
        'CANADA': /^[A-Z]\d[A-Z]\s\d[A-Z]\d$/i,
        'AU': /^\d{4}$/,                       // Australia: 4-digit
        'AUSTRALIA': /^\d{4}$/,
        'JP': /^\d{3}-\d{4}$/,                // Japan: 123-4567
        'JAPAN': /^\d{3}-\d{4}$/,
        'DE': /^\d{5}$/,                      // Germany: 5-digit
        'GERMANY': /^\d{5}$/,
        'FR': /^\d{5}$/,                      // France: 5-digit
        'FRANCE': /^\d{5}$/,
        'IT': /^\d{5}$/,                      // Italy: 5-digit
        'ITALY': /^\d{5}$/,
        'ES': /^\d{5}$/,                      // Spain: 5-digit
        'SPAIN': /^\d{5}$/,
        'NL': /^\d{4}\s[A-Z]{2}$/i,          // Netherlands: 1234 AB
        'NETHERLANDS': /^\d{4}\s[A-Z]{2}$/i,
        'AT': /^\d{4}$/,                      // Austria: 4-digit
        'AUSTRIA': /^\d{4}$/,
        'CH': /^\d{4}$/,                      // Switzerland: 4-digit
        'SWITZERLAND': /^\d{4}$/,
        'IN': /^\d{6}$/,                      // India: 6-digit
        'INDIA': /^\d{6}$/,
        'BR': /^\d{5}-\d{3}$/,                // Brazil: 12345-678
        'BRAZIL': /^\d{5}-\d{3}$/,
        'MX': /^\d{5}$/,                      // Mexico: 5-digit
        'MEXICO': /^\d{5}$/,
      };
      
      const countryPattern = zipPatternMap[countryDetected];
      if (countryPattern) {
        zipPatterns.unshift(countryPattern); // Try country-specific pattern first
        console.log('Applied country-specific zip pattern for:', countryDetected);
      }
    }
    
    // Detect zip code using all applicable patterns
    let zipIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      for (const pattern of zipPatterns) {
        if (pattern.test(parts[i])) {
          zipIndex = i;
          scrapedZipCode = parts[i];
          console.log('Zip matched with pattern, index:', zipIndex, 'Value:', scrapedZipCode);
          break;
        }
      }
      if (zipIndex > -1) break;
    }
    
    console.log('Detected zip at index:', zipIndex, 'Value:', scrapedZipCode);
    
    // Assign components based on detected zip position or count
    if (zipIndex > 0) {
      // If zip found, assign based on its position
      scrapedStreetAddress = parts[0]; // First part is always street
      
      if (zipIndex >= 2) {
        scrapedCity = parts[1]; // Second part is city
        scrapedState = parts[2]; // Third part is state
      } else if (zipIndex === 1) {
        scrapedCity = parts[1]; // If zip is second, city is second (no state)
      }
    } else {
      // No zip found, assign by position
      if (parts.length >= 1) scrapedStreetAddress = parts[0];
      if (parts.length >= 2) scrapedCity = parts[1];
      if (parts.length >= 3) scrapedState = parts[2];
      if (parts.length >= 4) scrapedZipCode = parts[3];
    }
    
    // Fallback: if zip still missing, use flexible pattern to extract any postal code
    if (!scrapedZipCode) {
      // Try multiple fallback patterns: digits, letters+digits, digits+letters
      const fallbackPatterns = [
        /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/i,  // UK postcodes
        /\b[A-Z]\d[A-Z]\s\d[A-Z]\d\b/i,            // Canada
        /\b\d{5}-\d{3}\b/,                          // Brazil
        /\b\d{3}-\d{4}\b/,                          // Japan
        /\b\d{5}\s[A-Z]{2}\b/i,                     // Netherlands
        /\b\d{4,6}\b/,                              // Default: 4-6 digit sequence
      ];
      
      // Try patterns on both original and cleaned versions
      for (const source of [hqClean, scrapedHeadquarters]) {
        for (const pattern of fallbackPatterns) {
          const zipMatch = source.match(pattern);
          if (zipMatch) {
            scrapedZipCode = zipMatch[0];
            console.log('Fallback zip extraction matched:', scrapedZipCode, 'from:', source);
            break;
          }
        }
        if (scrapedZipCode) break;
      }
    }
    
    console.log('Parsed address components dynamically:', {
      street: scrapedStreetAddress,
      city: scrapedCity,
      state: scrapedState,
      zip: scrapedZipCode
    });
  }
  
  // Prefer employee directory address fields if provided
  const directoryStreet = data.scrapedStreetAddress || '';
  const directoryCity = data.scrapedCity || '';
  const directoryState = data.scrapedState || '';
  const directoryZip = data.scrapedZipCode || '';
  
  if (directoryStreet || directoryCity || directoryState || directoryZip) {
    scrapedStreetAddress = directoryStreet || scrapedStreetAddress;
    scrapedCity = directoryCity || scrapedCity;
    scrapedState = directoryState || scrapedState;
    scrapedZipCode = directoryZip || scrapedZipCode;
    console.log('Using employee directory address override:', {
      street: scrapedStreetAddress,
      city: scrapedCity,
      state: scrapedState,
      zip: scrapedZipCode
    });
  }
  
  console.log('Using scraped data:', { scrapedPhone, scrapedHeadquarters, scrapedEmployees, scrapedRevenue, scrapedEmail });
  
  // Convert ZoomInfo employee count to Buildata dropdown value
  let employeeDropdownValue = '';
  if (scrapedEmployees) {
    const empStr = scrapedEmployees.toLowerCase().replace(/,/g, '');
    
    // Parse number from string (e.g., "10K+" -> 10000, "2.5K" -> 2500)
    let empNum = 0;
    if (empStr.includes('k')) {
      empNum = parseFloat(empStr.replace(/[^0-9.]/g, '')) * 1000;
    } else {
      empNum = parseInt(empStr.replace(/[^0-9]/g, '')) || 0;
    }
    
    // Map to dropdown numeric values based on ranges
    if (empNum > 10000 || empStr.includes('10k+')) {
      employeeDropdownValue = '8'; // more than 10000
    } else if (empNum > 5000) {
      employeeDropdownValue = '7'; // 5001 - 10000
    } else if (empNum > 2000) {
      employeeDropdownValue = '6'; // 2001 - 5000
    } else if (empNum > 1000) {
      employeeDropdownValue = '5'; // 1001 - 2000
    } else if (empNum > 500) {
      employeeDropdownValue = '4'; // 501 - 1000
    } else if (empNum > 200) {
      employeeDropdownValue = '3'; // 201 - 500
    } else if (empNum > 50) {
      employeeDropdownValue = '2'; // 51 - 200
    } else if (empNum >= 1) {
      employeeDropdownValue = '1'; // 1 - 50
    }
    
    console.log('Converted employees to dropdown:', scrapedEmployees, '→ value:', employeeDropdownValue, `(parsed: ${empNum})`);
  }
  
  // Convert ZoomInfo revenue to Buildata dropdown value
  let revenueDropdownValue = '';
  if (scrapedRevenue) {
    const revStr = scrapedRevenue.toLowerCase().replace(/[$,]/g, '');
    
    // Parse revenue amount (e.g., "$6.8 Billion" -> 6.8B, "$150 Million" -> 150M)
    let revMillions = 0;
    if (revStr.includes('billion')) {
      revMillions = parseFloat(revStr.replace(/[^0-9.]/g, '')) * 1000;
    } else if (revStr.includes('million')) {
      revMillions = parseFloat(revStr.replace(/[^0-9.]/g, ''));
    }
    
    // Map to dropdown numeric values based on ranges
    if (revMillions >= 1000 || revStr.includes('billion')) {
      revenueDropdownValue = '7'; // 1 Billion and Above
    } else if (revMillions >= 500) {
      revenueDropdownValue = '6'; // 500 Million to 1 Billion
    } else if (revMillions >= 250) {
      revenueDropdownValue = '5'; // 250 Million to 500 Million
    } else if (revMillions >= 100) {
      revenueDropdownValue = '4'; // 100 Million to 250 Million
    } else if (revMillions >= 50) {
      revenueDropdownValue = '3'; // 50 Million to 100 Million
    } else if (revMillions >= 10) {
      revenueDropdownValue = '2'; // 10 Million to 50 Million
    } else if (revMillions > 0) {
      revenueDropdownValue = '1'; // Upto 10 Million
    }
    
    console.log('Converted revenue to dropdown:', scrapedRevenue, '→ value:', revenueDropdownValue, `(parsed: ${revMillions}M)`);
  }
  
  // Employee directory count removed; rely on scrapedEmployees only.
  // Handle Campaign dropdown - wait for completion before continuing
  let campaignSelected = false;
  if (data.campaignName && data.campaignName.trim()) {
    console.log('🎯 Starting campaign selection for:', data.campaignName);
    try {
      await selectCampaign(data.campaignName);
      console.log('✓✓✓ Campaign selection completed successfully');
      campaignSelected = true;
    } catch (error) {
      console.error('❌❌❌ Campaign selection FAILED:', error);
      console.error('Error details:', error.stack);
      console.error('⛔ STOPPING - Cannot proceed without campaign selection');
      throw new Error('Campaign selection required but failed: ' + error.message);
    }
    // Extra wait after campaign selection to ensure form is ready
    await sleep(2000);
  } else {
    console.log('⚠️ No campaign name provided or campaign toggle is OFF - skipping campaign selection');
    campaignSelected = true; // Allow to proceed if campaign not required
  }
  
  // Only continue if campaign selection succeeded (or wasn't required)
  if (!campaignSelected) {
    console.error('⛔ Stopping form fill - campaign selection required but not completed');
    return;
  }
  
  // Fill email and click Check Email button
  await typeSlowly('input#emailaddress', scrapedEmail || data['Email Address'] || data.email || '');
  await sleep(500);
  
  // Click Check Email button - dynamically find it by text
  if (data.autoButtonsEnabled !== false) {
    const checkEmailBtn = findButtonByText('Check Email');
    if (checkEmailBtn) {
      console.log('✓ Clicking Check Email button...');
      checkEmailBtn.click();
      await sleep(2000); // Wait for email validation
      await handleModalIfAppears('OK');
    } else {
      console.warn('⚠️ Check Email button not found');
    }
  } else {
    console.log('⏭️ Auto button clicks OFF - skipping Check Email');
  }
  
  // Fill website/domain and click Check Suppression button
  await typeSlowly('input#website', domain);
  await sleep(500);
  
  // Click Check Suppression button - dynamically find it
  if (data.autoButtonsEnabled !== false) {
    const checkSuppressionBtn = findButtonByText('Check Suppression');
    if (checkSuppressionBtn) {
      console.log('✓ Clicking Check Suppression button...');
      checkSuppressionBtn.click();
      await sleep(2000); // Wait for suppression check
      await handleModalIfAppears('OK');
    } else {
      console.warn('⚠️ Check Suppression button not found');
    }
  } else {
    console.log('⏭️ Auto button clicks OFF - skipping Check Suppression');
  }
  
  await typeSlowly('input#contactlink', data['Contact Link'] || data.contactLinkedIn || '');
  await sleep(500);
  
  // Click Check Duplicates button - dynamically find it
  if (data.autoButtonsEnabled !== false) {
    const checkDuplicatesBtn = findButtonByText('Check Duplicates');
    if (checkDuplicatesBtn) {
      console.log('✓ Clicking Check Duplicates button...');
      checkDuplicatesBtn.click();
      await sleep(2000); // Wait for duplicate check
      await handleModalIfAppears('OK');
    } else {
      console.warn('⚠️ Check Duplicates button not found');
    }
  } else {
    console.log('⏭️ Auto button clicks OFF - skipping Check Duplicates');
  }
  
  // === COMPANY PROFILE ===
  await typeSlowly('input#company', data.Company || data.company || '');
  await typeSlowly('input#companylinkedinurl', linkedinUrl);
  
  // Employee Range dropdown (values 1-8) - use converted value
  const empValue = employeeDropdownValue || data['Employee Range'] || data.employeeRange || '';
  console.log('Setting Employee Range:', empValue);
  await setDropdown('div.form-group:has(label[for="employeerange"]) select.form-control, div.form-group:has(label[for="employeerange"]) select.form-select', empValue);
  
  // Revenue Range dropdown (values 1-7) - use converted value
  const revValue = revenueDropdownValue || data['Revenue Range'] || data.revenueRange || '';
  console.log('Setting Revenue Range:', revValue);
  await setDropdown('div.form-group:has(label[for="revenuerange"]) select.form-control, div.form-group:has(label[for="revenuerange"]) select.form-select', revValue);
  
  // SIC Code
  console.log('Setting SIC Code:', data['SIC Code'] || data.sicCode);
  await typeSlowly('input#siccode', data['SIC Code'] || data.sicCode || '');
  
  // NAICS Code
  console.log('Setting NAICS Code:', data['NAICS Code'] || data.naicsCode);
  await typeSlowly('input#naicscode', data['NAICS Code'] || data.naicsCode || '');
  
  // Industry dropdown (values 1-22) - REQUIRED
  console.log('Setting Industry:', data.Industry || data.industry);
  await setDropdown('div.form-group:has(label[for="industry"]) select.form-control', data.Industry || data.industry || '');
  
  // Sub Industry dropdown
  console.log('Setting Sub Industry:', data['Sub Industry'] || data.subIndustry);
  await setDropdown('div.form-group:has(label[for="subindustry"]) select.form-control', data['Sub Industry'] || data.subIndustry || '');
  
  // Verification links (fallback to ZoomInfo URL)
  const zoomInfoUrl = data.scrapedZoomInfoUrl || data.zoomInfoUrl || data['ZoomInfo URL'] || '';
  await typeSlowly('input#employeesizeverificationlink', data['Employee Size Verification Link'] || zoomInfoUrl);
  await typeSlowly('input#industryverificationurl', data['Industry Verification Link'] || zoomInfoUrl);
  await typeSlowly('input#revenueverificationurl', data['Naics/Sic/Revenue Verification Link'] || data['Revenue Verification Link'] || zoomInfoUrl);
  
  // === CONTACT PROFILE ===
  await typeSlowly('input#firstname', firstName);
  await typeSlowly('input#lastname', lastName);
  await typeSlowly('input#title', data.Title || data.title || '');
  
  // Seniority dropdown (values 1-5)
  await setDropdown('div.form-group:has(label[for="seniority"]) select.form-control', data.Seniority || data.seniority || '');
  
  // Department dropdown (values 1-16)
  await setDropdown('div.form-group:has(label[for="department"]) select.form-control', data.Department || data.department || '');
  
  // Function dropdown
  await setDropdown('div.form-group:has(label[for="function"]) select.form-control', data.Function || data.function || '');
  
  // Specialty dropdown
  await setDropdown('div.form-group:has(label[for="specialty"]) select.form-control', data.Specialty || data.specialty || '');
  
  // Contact Number - extract country code from scraped phone if available
  let phoneCode = data['Phone Code'] || data.phoneCode || '';
  if (!phoneCode && scrapedPhone) {
    // Extract country code from phone number (e.g., "+49 4971329810" -> "49")
    const phoneMatch = scrapedPhone.match(/^\+?(\d{1,4})/);
    if (phoneMatch) {
      phoneCode = phoneMatch[1];
      console.log('Extracted phone code from scraped phone:', phoneCode);
    }
  }
  // Clean phone code (remove + and spaces)
  if (phoneCode) {
    phoneCode = phoneCode.replace(/[\+\s-]/g, '');
  }
  
  await setDropdown('div.form-group:has(label[for="countrycode"]) select.form-control', phoneCode);
  
  // Clean phone number (remove country code prefix for the phone field)
  let cleanPhone = scrapedPhone || data.Phone || data.phone || '';
  if (cleanPhone && phoneCode) {
    // Remove country code prefix from phone number
    cleanPhone = cleanPhone.replace(/^\+?/, '').replace(new RegExp('^' + phoneCode), '').trim();
  }
  await typeSlowly('input[name="ContactDto.Phone_work"]', cleanPhone);
  
  // Address fields - improved selectors
  await sleep(300);
  
  // Street Address
  let streetInput = document.querySelector('input#streetaddress');
  if (!streetInput) {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
    const parent = inputs.find(i => {
      const label = i.closest('div.form-group')?.querySelector('label');
      return label && label.textContent.includes('Street Address');
    });
    if (parent) streetInput = parent;
  }
  if (streetInput) {
    const streetValue = scrapedStreetAddress || data['Street Address'] || data.address || '';
    if (streetValue) {
      streetInput.value = streetValue;
      streetInput.dispatchEvent(new Event('input', { bubbles: true }));
      streetInput.dispatchEvent(new Event('change', { bubbles: true }));
      streetInput.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log(`✓ Street Address filled: "${streetValue.substring(0, 40)}..."`);
    }
  } else {
    console.warn(`❌ Street Address input not found`);
  }
  
  // City
  let cityInput = document.querySelector('input#city');
  if (!cityInput) {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
    const parent = inputs.find(i => {
      const label = i.closest('div.form-group')?.querySelector('label');
      return label && label.textContent.trim() === 'City';
    });
    if (parent) cityInput = parent;
  }
  if (cityInput) {
    const cityValue = scrapedCity || data.City || data.city || '';
    if (cityValue) {
      cityInput.value = cityValue;
      cityInput.dispatchEvent(new Event('input', { bubbles: true }));
      cityInput.dispatchEvent(new Event('change', { bubbles: true }));
      cityInput.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log(`✓ City filled: "${cityValue}"`);
    }
  } else {
    console.warn(`❌ City input not found`);
  }
  
  // State
  let stateInput = document.querySelector('input#state');
  if (!stateInput) {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
    const parent = inputs.find(i => {
      const label = i.closest('div.form-group')?.querySelector('label');
      return label && label.textContent.trim() === 'State';
    });
    if (parent) stateInput = parent;
  }
  if (stateInput) {
    const stateValue = scrapedState || data.State || data.state || '';
    if (stateValue) {
      stateInput.value = stateValue;
      stateInput.dispatchEvent(new Event('input', { bubbles: true }));
      stateInput.dispatchEvent(new Event('change', { bubbles: true }));
      stateInput.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log(`✓ State filled: "${stateValue}"`);
    }
  } else {
    console.warn(`❌ State input not found`);
  }
  
  // Zip Code
  let zipInput = document.querySelector('input#zip');
  if (!zipInput) {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
    const parent = inputs.find(i => {
      const label = i.closest('div.form-group')?.querySelector('label');
      return label && (label.textContent.includes('Zip') || label.textContent.includes('zip'));
    });
    if (parent) zipInput = parent;
  }
  if (zipInput) {
    let zipValue = scrapedZipCode || data.Zip || data.zipCode || data.zip || '';
    if (zipValue) {
      // Normalize to digits only and limit to first 5-6 digits
      const zipMatch = String(zipValue).match(/\d{4,6}/);
      zipValue = zipMatch ? zipMatch[0] : '';
    }
    if (zipValue) {
      zipInput.focus();
      zipInput.value = '';
      zipInput.dispatchEvent(new Event('input', { bubbles: true }));
      await typeSlowly(zipInput, zipValue);
      zipInput.dispatchEvent(new Event('change', { bubbles: true }));
      zipInput.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log(`✓ Zip Code filled: "${zipValue}"`);
    }
  } else {
    console.warn(`❌ Zip Code input not found`);
  }
  
  // Country dropdown (values 1-231)
  console.log('Setting Country to:', data.Country || data.country);
  await setDropdown('select[id="country"], div.form-group:has(label[for="country"]) select.form-control', data.Country || data.country || '');
  
  // Comments
  await typeSlowly('textarea#comments', data.Comments || data.comments || '');
  
  console.log('✓✓✓ FORM FILLING COMPLETED ✓✓✓');
  console.log('All fields filled successfully!');
}

function set(selector, value) {
  if (!value) return;
  const el = document.querySelector(selector);
  if (el) {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

async function selectCampaign(campaignName) {
  console.log(`\n========== CAMPAIGN SELECTION START ==========`);
  console.log(`🔍 Campaign: "${campaignName}"`);
  
  try {
    await sleep(500);
    
    // Dynamic helper: Find dropdown button by nearby label text
    const findDropdownButtonByLabel = (labelText) => {
      const labels = Array.from(document.querySelectorAll('label'));
      const label = labels.find(l => l.textContent.toUpperCase().includes(labelText.toUpperCase()));
      if (label) {
        const formGroup = label.closest('div.form-group');
        if (formGroup) {
          return formGroup.querySelector('button.dropdown-toggle, button.btn.dropdown-toggle');
        }
      }
      return null;
    };
    
    console.log('Step 1: Looking for campaign dropdown button...');
    let campaignBtn = findDropdownButtonByLabel('Campaign');
    
    if (campaignBtn) {
      console.log('   ✓ Found campaign button using label lookup');
    } else {
      console.log('   ⚠️ Label lookup failed, trying generic selector...');
      campaignBtn = document.querySelector('button.dropdown-toggle[type="button"], button.btn.dropdown-toggle');
      if (campaignBtn) {
        console.log('   ✓ Found button with generic selector');
      }
    }
    
    if (!campaignBtn) {
      console.error('   ❌ FAILED: Campaign dropdown button not found');
      throw new Error('Campaign dropdown button not found');
    }
    
    console.log('Step 2: Clicking campaign button to open dropdown...');
    
    // Debug: log button details
    console.log('   Button details:', {
      tagName: campaignBtn.tagName,
      className: campaignBtn.className,
      type: campaignBtn.type,
      disabled: campaignBtn.disabled,
      visible: campaignBtn.offsetParent !== null
    });
    
    // Try multiple click methods for Blazor components
    campaignBtn.focus();
    console.log('   ✓ Button focused');
    await sleep(300);
    
    // Method 1: Standard click
    campaignBtn.click();
    console.log('   ✓ Standard click executed');
    await sleep(1000);
    
    // Method 2: Try keyboard Enter if standard click didn't work
    if (!document.querySelector('.dropdown-menu.show, [role="listbox"], .ng-dropdown-panel, .cdk-overlay-pane')) {
      console.log('   ⚠️ Standard click didn\'t open dropdown, trying keyboard Enter...');
      campaignBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      campaignBtn.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
      await sleep(1000);
    }
    
    // Method 3: Try ArrowDown if still not open
    if (!document.querySelector('.dropdown-menu.show, [role="listbox"], .ng-dropdown-panel, .cdk-overlay-pane')) {
      console.log('   ⚠️ Keyboard Enter didn\'t work, trying ArrowDown...');
      campaignBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
      await sleep(1000);
    }
    
    console.log('   ✓ Waiting for dropdown to render...');
    
    // Enhanced panel detection with more wait attempts
    const waitForDropdownPanel = async (maxWait = 20) => {
      const selectors = [
        '.dropdown-menu.show',
        '.dropdown-menu[style*="display"]',
        '[role="listbox"]',
        '.ng-dropdown-panel',
        '.cdk-overlay-pane',
        '.select2-container--open',
        '.virtualized',
        '[class*="dropdown"][class*="show"]',
        '[class*="dropdown"][style*="display"]'
      ];
      
      for (let i = 0; i < maxWait; i++) {
        for (const selector of selectors) {
          const panel = document.querySelector(selector);
          if (panel && panel.offsetHeight > 0) {
            console.log(`   ✓ Dropdown panel detected (${selector}) at attempt ${i + 1}`);
            return panel;
          }
        }
        if (i % 5 === 0 && i > 0) console.log(`   ⏳ Waiting for panel... (attempt ${i + 1}/${maxWait})`);
        await sleep(250);
      }
      
      // Debug: check if any panels exist but are hidden
      const allPanels = document.querySelectorAll('[class*="dropdown"], [role="listbox"], .overlay, [class*="popup"]');
      console.log(`   ℹ️ Found ${allPanels.length} potential panel elements (but none are visible)`);
      return null;
    };
    
    const panelElement = await waitForDropdownPanel();
    if (!panelElement) {
      console.warn('   ⚠️ Dropdown panel not detected after 20 attempts; trying secondary click...');
      campaignBtn.click();
      await sleep(1000);
    }
    
    console.log('Step 3: Looking for search input...');
    
    // Step 3A: Find the dropdown panel first (the one showing)
    let dropdownPanel = null;
    const panelSelectors = [
      '.dropdown-menu.show',
      '.show[class*="dropdown"]',
      '[role="listbox"].show',
      '.cdk-overlay-pane',
      '.dropdown-menu[style*="display: block"]'
    ];
    
    for (const selector of panelSelectors) {
      dropdownPanel = document.querySelector(selector);
      if (dropdownPanel) {
        console.log(`   ✓ Found dropdown panel with selector: "${selector}"`);
        break;
      }
    }
    
    if (!dropdownPanel) {
      console.log('   ⚠️ No dropdown panel found with standard selectors');
    }
    
    // Step 3B: The virtualized container should be INSIDE the panel
    let virtualizedContainer = null;
    if (dropdownPanel) {
      virtualizedContainer = dropdownPanel.querySelector('.virtualized');
      console.log(`   Virtualized inside panel: ${virtualizedContainer ? 'YES' : 'NO'}`);
    }
    
    // Fallback: Find any visible virtualized container
    if (!virtualizedContainer) {
      const allVirtualized = Array.from(document.querySelectorAll('.virtualized'));
      for (const virt of allVirtualized) {
        if (virt.offsetHeight > 0) {
          virtualizedContainer = virt;
          console.log('   ✓ Found visible virtualized container as fallback');
          break;
        }
      }
    }
    
    // Step 3C: Find search input - MUST be inside virtualized
    let searchInput = null;
    
    if (virtualizedContainer) {
      // Log the structure we're searching in
      const children = Array.from(virtualizedContainer.children);
      console.log(`   Virtualized has ${children.length} direct children`);
      children.forEach((child, idx) => {
        console.log(`      Child ${idx}: ${child.className} - visible: ${child.offsetHeight > 0}`);
      });
      
      // The input should be in a wrapper div, likely the first visible child
      const inputWrappers = virtualizedContainer.querySelectorAll('[class*="m-"], [class*="p-"], .input-group');
      console.log(`   Found ${inputWrappers.length} potential input wrapper elements`);
      
      // Try to find input in these wrappers
      for (const wrapper of inputWrappers) {
        const input = wrapper.querySelector('input[type="text"], input[placeholder*="Search"], input.form-control');
        if (input && input.offsetHeight > 0) {
          searchInput = input;
          console.log(`   ✓ Found search input in wrapper: ${wrapper.className}`);
          break;
        }
      }
      
      // If not found in wrappers, try direct search
      if (!searchInput) {
        searchInput = virtualizedContainer.querySelector('input[type="text"], input.form-control, input[placeholder*="Search"]');
        if (searchInput && searchInput.offsetHeight > 0) {
          console.log(`   ✓ Found search input via direct query`);
        } else {
          searchInput = null;
        }
      }
    }
    
    if (!searchInput) {
      console.log('   ⚠️ Search input not found in virtualized container');
      // Last resort: find ANY visible text input on page near a dropdown
      const allInputs = Array.from(document.querySelectorAll('input[type="text"], input.form-control'));
      for (const inp of allInputs) {
        if (inp.offsetHeight > 0 && inp.placeholder && inp.placeholder.includes('Search')) {
          searchInput = inp;
          console.log(`   ✓ Found search input via page-wide search`);
          break;
        }
      }
    }
    
    if (!searchInput && dropdownPanel) {
      const additionalSelectors = [
        'input.form-control[placeholder="Search..."]',
        'input[placeholder*="Search"]'
      ];
      for (const selector of additionalSelectors) {
        searchInput = dropdownPanel.querySelector(selector);
        if (searchInput && searchInput.offsetHeight > 0) {
          console.log(`   ✓ Found search input in panel with selector: "${selector}"`);
          break;
        }
      }
    }
    
    if (!searchInput) {
      console.log('   ⚠️ Search input not found. Searching document-wide...');
      const additionalSelectors = [
        'input.form-control[placeholder="Search..."]',
        'input[placeholder*="Search"]',
        'input[type="text"]'
      ];
      for (const selector of additionalSelectors) {
        searchInput = document.querySelector(selector);
        if (searchInput && searchInput.offsetHeight > 0 && searchInput.closest('.virtualized')) {
          console.log(`   ✓ Found search input in document with selector: "${selector}"`);
          break;
        }
      }
    }
    
    if (searchInput) {
      console.log('   ✓ Found search input!');
      console.log(`   Input element:`, searchInput);
      console.log(`Step 4: Searching for campaign: "${campaignName}"`);
      
      // IMPORTANT: Type the campaign name into the search input to filter
      searchInput.focus();
      searchInput.value = '';
      
      // Type the campaign name/ID character by character using typeSlowly
      // This works with any format: IDs, names, numbers, etc.
      await typeSlowly(searchInput, campaignName.toString());
      
      console.log(`   ✓ Typed search query into input`);
      
      // Wait for dropdown to filter and show matching results
      // Longer timeout for server-side filtering
      await sleep(2500);
    } else {
      console.error('   ❌ Search input not found after all attempts');
      throw new Error(`Could not find search input in campaign dropdown`);
    }
    
    console.log('Step 5: Waiting for filtered dropdown results...');
    
    const getDropdownItems = () => {
      // Search inside virtualized container first (most reliable)
      let container = virtualizedContainer || dropdownPanel || document;
      
      // Get all dropdown items from the container
      const items = Array.from(container.querySelectorAll('div.dropdown-item')).filter(item => {
        const text = item.textContent.trim();
        return text.length > 0 && item.offsetHeight > 0;
      });
      
      return items;
    };
    
    // Dynamic fuzzy matching - works with any campaign name/ID format
    const matchesCampaign = (itemText, searchQuery) => {
      const itemLower = itemText.toLowerCase().trim();
      const queryLower = searchQuery.toLowerCase().trim();
      
      // Exact match
      if (itemLower === queryLower) return true;
      
      // Item starts with query
      if (itemLower.startsWith(queryLower)) return true;
      
      // Query is contained in item
      if (itemLower.includes(queryLower)) return true;
      
      // Fuzzy: all characters from query appear in item in order (case-insensitive)
      let queryIdx = 0;
      for (let i = 0; i < itemLower.length && queryIdx < queryLower.length; i++) {
        if (itemLower[i] === queryLower[queryIdx]) {
          queryIdx++;
        }
      }
      if (queryIdx === queryLower.length) return true;
      
      // Check data attributes as fallback
      return false;
    };
    
    let dropdownItems = [];
    let foundMatch = null;
    let waitAttempts = 0;
    const maxWaitAttempts = 60;
    
    // Keep checking until we find a dropdown item matching the campaign
    while (!foundMatch && waitAttempts < maxWaitAttempts) {
      await sleep(200);
      waitAttempts++;
      
      dropdownItems = getDropdownItems();
      
      if (dropdownItems.length === 0) {
        if (waitAttempts === 1 || waitAttempts % 10 === 0) {
          console.log(`   ⏳ Attempt ${waitAttempts}/${maxWaitAttempts}: Waiting for filtered results...`);
        }
        continue;
      }
      
      if (waitAttempts === 1) {
        console.log(`   ✓ Attempt ${waitAttempts}: Found ${dropdownItems.length} result(s)`);
      }
      
      const searchText = campaignName.toString().trim();
      
      // Try to find match using dynamic matching logic
      foundMatch = dropdownItems.find(item => {
        const itemText = (item.textContent || '').trim();
        return matchesCampaign(itemText, searchText);
      });
      
      // If still not found, try without spaces/special chars
      if (!foundMatch) {
        const cleanSearch = searchText.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (cleanSearch.length > 2) {
          foundMatch = dropdownItems.find(item => {
            const itemClean = item.textContent.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return matchesCampaign(itemClean, cleanSearch);
          });
        }
      }
      
      // If found, scroll to it
      if (foundMatch) {
        console.log(`   ✓✓✓ FOUND MATCH: "${foundMatch.textContent.trim()}"`);
        foundMatch.scrollIntoView({ behavior: 'auto', block: 'center' });
        await sleep(300);
        break;
      }
      
      if (waitAttempts === 1 && dropdownItems.length > 0) {
        console.log(`   Results (showing up to 5):`);
        dropdownItems.slice(0, 5).forEach((item, idx) => {
          const text = item.textContent.trim();
          console.log(`     ${idx}: "${text}"`);
        });
      }
    }
    
    if (!foundMatch) {
      console.error(`   ❌ No matching campaign found for: "${campaignName}"`);
      if (dropdownItems.length > 0) {
        console.log(`   Results found (first 10):`);
        dropdownItems.slice(0, 10).forEach((item, idx) => {
          const text = item.textContent.trim();
          console.log(`     ${idx}: "${text}"`);
        });
      } else {
        console.log(`   ⚠️ No results returned from search`);
      }
      throw new Error(`Campaign "${campaignName}" not found in dropdown`);
    }
    
    console.log('Step 6: Clicking matched campaign item...');
    
    // Scroll into view and click
    foundMatch.style.cursor = 'pointer';
    foundMatch.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    await sleep(200);
    
    const matchText = foundMatch.textContent.trim();
    console.log(`   Clicking: "${matchText}"`);
    foundMatch.click();
    console.log(`   ✓ Clicked campaign item`);
    
    console.log('Step 7: Waiting for form to update after selection...');
    await sleep(2000);
    
    console.log('Step 8: Looking for Load Specifications button...');
    if (window.__buildataAutoButtonsEnabled !== false) {
      const loadSpecBtn = findButtonByText('Load Specifications');
      if (loadSpecBtn) {
        console.log('   ✓ Found Load Specifications button');
        console.log('Step 9: Clicking Load Specifications...');
        loadSpecBtn.click();
        console.log('   ✓ Clicked, waiting 4000ms for load...');
        await sleep(4000);
      } else {
        console.warn('   ⚠️ Load Specifications button not found');
      }
    } else {
      console.log('⏭️ Auto button clicks OFF - skipping Load Specifications');
    }
    
  } catch (error) {
    console.error('❌❌❌ Campaign selection FAILED at step:', error.message);
    console.error('Full error:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

async function setDropdown(selector, value) {
  if (!value) return;
  
  let el = null;
  
  // Try direct selector first (handle multiple selectors separated by comma)
  const selectors = selector.split(',').map(s => s.trim());
  for (const sel of selectors) {
    el = document.querySelector(sel);
    if (el) break;
  }
  
  // If selector didn't work, try to find by ID extracted from label[for=
  if (!el && selector.includes('label[for=')) {
    const match = selector.match(/label\[for="([^"]+)"\]/);
    if (match) {
      const labelFor = match[1];
      el = document.querySelector(`select[id="${labelFor}"]`) ||
           document.querySelector(`select.form-select[id="${labelFor}"]`) ||
           document.querySelector(`select.form-control[id="${labelFor}"]`);
    }
  }
  
  // If still not found, search all form groups by label text
  if (!el) {
    const formGroups = Array.from(document.querySelectorAll('div.form-group'));
    const matchingGroup = formGroups.find(group => {
      const labelText = group.textContent.toLowerCase();
      const searchText = value.toLowerCase().split(' ')[0];
      return labelText.includes(searchText);
    });
    if (matchingGroup) {
      el = matchingGroup.querySelector('select.form-control, select.form-select');
    }
  }
  
  if (!el) {
    console.warn(`❌ Dropdown not found for: "${value.substring(0, 30)}" (selector: ${selector})`);
    return;
  }
  
  // For select elements, try to find matching option
  const options = Array.from(el.options);
  
  // Try exact match first (value or text)
  let matchedOption = options.find(opt => opt.value === value || opt.text === value);
  
  // Try partial match if no exact match
  if (!matchedOption) {
    const valueLower = value.toLowerCase();
    matchedOption = options.find(opt => 
      opt.value.toLowerCase().includes(valueLower) || 
      opt.text.toLowerCase().includes(valueLower)
    );
  }
  
  // Try reverse partial match (option text contains search value)
  if (!matchedOption) {
    const valueLower = value.toLowerCase();
    matchedOption = options.find(opt => 
      valueLower.includes(opt.text.toLowerCase())
    );
  }
  
  if (matchedOption) {
    console.log(`✓ Dropdown matched: "${matchedOption.text}" (value: ${matchedOption.value})`);
    el.value = matchedOption.value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(100);
  } else {
    console.warn(`⚠️ No match for "${value}". Available:`, options.map(o => `"${o.text}"`).slice(1, 6).join(', '));
  }
}

async function typeSlowly(selectorOrElement, value) {
  if (!value) return;
  const el = typeof selectorOrElement === 'string'
    ? document.querySelector(selectorOrElement)
    : selectorOrElement;
  if (!el) {
    console.warn(`❌ Input not found: ${selectorOrElement}`);
    return;
  }
  
  // Use native value setter to avoid double-typing side effects
  const setValue = (val) => {
    const prototype = Object.getPrototypeOf(el);
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (valueSetter) {
      valueSetter.call(el, val);
    } else {
      el.value = val;
    }
  };
  
  const commitValue = async (val, fireEvents = true) => {
    setValue(val);
    if (fireEvents) {
      // Fire comprehensive event sequence to trigger all filters
      el.dispatchEvent(new Event('focus', { bubbles: true }));
      await sleep(30);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      await sleep(60);
    }
  };
  
  el.focus();
  await sleep(100);
  
  // Clear field first
  await commitValue('', true);
  
  // Type character by character with events
  for (let i = 0; i < value.length; i++) {
    const charToType = value[i];
    const currentVal = el.value || '';
    const nextVal = currentVal + charToType;
    
    setValue(nextVal);
    
    // Fire events for each character
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: charToType, code: `Key${charToType.toUpperCase()}`, bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keypress', { key: charToType, bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: charToType, code: `Key${charToType.toUpperCase()}`, bubbles: true }));
    
    await sleep(30);
  }
  
  // Final event burst to ensure all listeners fire
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
  
  console.log(`✓ Typed "${value.substring(0, 40)}${value.length > 40 ? '...' : ''}" into ${typeof selectorOrElement === 'string' ? selectorOrElement : 'input element'}`);
  await sleep(150);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
