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
  
  // === PREBUILD SECTION ===
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
    const streetValue = scrapedHeadquarters || data['Street Address'] || data.address || '';
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
    const cityValue = data.City || data.city || '';
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
    const stateValue = data.State || data.state || '';
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
    const zipValue = data.Zip || data.zipCode || data.zip || '';
    if (zipValue) {
      zipInput.value = zipValue;
      zipInput.dispatchEvent(new Event('input', { bubbles: true }));
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
    
    console.log('Step 2: Clicking campaign button...');
    campaignBtn.click();
    console.log('   ✓ Button clicked, waiting 2500ms...');
    await sleep(2500);
    
    console.log('Step 3: Looking for search input...');
    // Find and focus search input with multiple fallback selectors
    let searchInput = document.querySelector('input.form-control[placeholder="Search..."]') ||
              document.querySelector('input[placeholder*="Search"]') ||
              document.querySelector('.dropdown-menu input.form-control') ||
              document.querySelector('input[type="search"]') ||
              document.querySelector('input[aria-label*="Search"]') ||
              document.querySelector('input[role="combobox"]') ||
              document.querySelector('input[type="text"].form-control');
    
    if (searchInput) {
      console.log('   ✓ Found search input');
      console.log(`   Input element:`, searchInput);
      
      console.log('Step 4: Setting campaign value...');
      searchInput.focus();
      console.log('   ✓ Focused input');
      await sleep(1000);
      
      // Set value directly in one operation
      console.log(`   Setting value to: "${campaignName}"`);
      searchInput.value = campaignName;
      console.log(`   Current value after set: "${searchInput.value}"`);
      
      // Fire keyboard events that actually trigger filtering
      console.log('   Firing keyboard events to trigger filter...');
      for (let i = 0; i < campaignName.length; i++) {
        searchInput.dispatchEvent(new KeyboardEvent('keydown', { 
          key: campaignName[i], 
          code: `Key${campaignName[i].toUpperCase()}`,
          bubbles: true 
        }));
        searchInput.dispatchEvent(new KeyboardEvent('keyup', { 
          key: campaignName[i], 
          code: `Key${campaignName[i].toUpperCase()}`,
          bubbles: true 
        }));
      }
      
      // Also fire input event
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('   ✓ Dispatched keyboard and input events');
      
      console.log('   Waiting for dropdown to filter to show matching campaigns...');
      // Wait until dropdown filters to show only matching items
      let foundMatchingItems = false;
      let waitAttempts = 0;
      const maxAttempts = 15;
      
      while (!foundMatchingItems && waitAttempts < maxAttempts) {
        await sleep(300);
        waitAttempts++;
        
        const tempItems = Array.from(document.querySelectorAll('div.dropdown-item'));
        const matchingItems = tempItems.filter(item => {
          const itemText = item.textContent.toLowerCase();
          const searchText = campaignName.toLowerCase();
          return itemText.includes(searchText);
        });
        
        if (matchingItems.length > 0) {
          console.log(`   ✓ Found ${matchingItems.length} matching item(s) for "${campaignName}" (attempt ${waitAttempts})`);
          matchingItems.forEach((item, idx) => {
            console.log(`     Match ${idx}: "${item.textContent.trim().substring(0, 50)}..."`);
          });
          console.log(`   Total items in dropdown: ${tempItems.length}`);
          foundMatchingItems = true;
        } else if (tempItems.length < 20) {
          // If items are fewer than before, dropdown is filtering
          console.log(`   ✓ Dropdown filtered to ${tempItems.length} items (attempt ${waitAttempts})`);
          tempItems.forEach((item, idx) => {
            console.log(`     Item ${idx}: "${item.textContent.trim().substring(0, 50)}..."`);
          });
          foundMatchingItems = true;
        } else {
          console.log(`   ⏳ Waiting... ${tempItems.length} total items, ${matchingItems.length} matching (attempt ${waitAttempts}/${maxAttempts})`);
        }
      }
      
      if (!foundMatchingItems) {
        console.warn(`   ⚠️ Timeout waiting for filtered items after ${maxAttempts} attempts`);
        console.log('   Note: Campaign ID "' + campaignName + '" may not exist in dropdown, or dropdown filtering is not responding');
      }
    } else {
      console.warn('   ⚠️ Search input not found. Trying to select from dropdown list directly.');
      await sleep(1000);
    }
    
    console.log('Step 5: Waiting for dropdown items to appear with typed campaign name...');
    
    let dropdownItems = [];
    let foundMatch = null;
    let waitAttempts = 0;
    const maxWaitAttempts = 30; // Wait up to 9 seconds
    
    // Keep checking until we find a dropdown item matching the campaign name we typed
    while (!foundMatch && waitAttempts < maxWaitAttempts) {
      await sleep(300);
      waitAttempts++;
      
      // Look for all dropdown-item divs
      dropdownItems = Array.from(document.querySelectorAll('div.dropdown-item'));
      
      if (dropdownItems.length === 0) {
        if (waitAttempts === 1 || waitAttempts % 5 === 0) {
          console.log(`   ⏳ Attempt ${waitAttempts}/${maxWaitAttempts}: No dropdown items yet...`);
        }
        continue;
      }
      
      console.log(`   ✓ Attempt ${waitAttempts}: Found ${dropdownItems.length} dropdown items`);
      
      // Look for item matching the campaign name
      foundMatch = dropdownItems.find(item => {
        const itemText = item.textContent.trim();
        const searchText = campaignName.trim();
        return itemText === searchText || itemText.startsWith(searchText);
      });
      
      if (foundMatch) {
        console.log(`   ✓✓✓ FOUND MATCH: "${foundMatch.textContent.trim()}"`);
        break;
      } else {
        // Show first few items for debugging
        if (waitAttempts === 1 || waitAttempts % 5 === 0) {
          console.log(`   Waiting for "${campaignName}" to appear... Items shown:`);
          dropdownItems.slice(0, 3).forEach((item, idx) => {
            console.log(`     ${idx}: "${item.textContent.trim()}"`);
          });
        }
      }
    }
    
    if (!foundMatch) {
      console.error(`   ❌ Campaign "${campaignName}" not found in dropdown after ${waitAttempts} attempts`);
      if (dropdownItems.length > 0) {
        console.log(`   Available items in dropdown:`);
        dropdownItems.slice(0, 10).forEach((item, idx) => {
          console.log(`     ${idx}: "${item.textContent.trim()}"`);
        });
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
        const allButtons = Array.from(document.querySelectorAll('button'));
        allButtons.slice(0, 10).forEach((btn, idx) => {
          console.log(`   Button ${idx}: "${btn.textContent.trim().substring(0, 40)}..."`);
        });
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

async function typeSlowly(selector, value) {
  if (!value) return;
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`❌ Input not found: ${selector}`);
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
  
  const commitValue = async (val) => {
    setValue(val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(60);
  };
  
  el.focus();
  await sleep(80);
  
  // Clear then set final value in one pass
  await commitValue('');
  await commitValue(value);
  el.blur();
  
  // If value didn't stick (common after CSV reupload), fallback to manual typing
  if (el.value !== value) {
    console.warn(`⚠️ Value mismatch for ${selector}. Retrying with manual typing.`);
    el.focus();
    await sleep(50);
    await commitValue('');
    for (let i = 0; i < value.length; i++) {
      const nextVal = (el.value || '') + value[i];
      setValue(nextVal);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(40);
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
  }
  
  console.log(`✓ Typed "${value.substring(0, 40)}${value.length > 40 ? '...' : ''}" into ${selector}`);
  await sleep(120);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
