// Click 'OK' button if present (e.g., after validation or modal)
// (This block should be inside an async function, not top-level)

// --- Types ---
interface Lead {
  firstNameLastName?: string;
  title?: string;
  contactLink?: string;
  domain?: string;
  company?: string;
  companyLinkedIn?: string;
  location?: string;
  campaign?: string;
  [key: string]: any; // fallback for dynamic CSV columns
}

import fs from 'fs';
import csv from 'csv-parser';
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import dotenv from 'dotenv';
dotenv.config();

// Helper to read CSV
function readCSV(path: string): Promise<Lead[]> {
  return new Promise((resolve) => {
    const results: Lead[] = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on('data', (row) => {
        results.push({
          firstNameLastName: row['First Name, Last Name'] || '',
          title: row['Title'] || '',
          contactLink: row['Contact Link'] || '',
          domain: row['Domain or Website'] || '',
          company: row['Company'] || '',
          companyLinkedIn: row['Company Linkedin URL'] || '',
          location: row['Column_7_Text'] || '',
          campaign: row['Column_8_Text'] || '',
          ...row // keep all other columns for dynamic access
        });
      })
      .on('end', () => resolve(results));
  });
}

// Helper to extract info from Google search result
async function getZoomInfoData(page: Page, domain: string) {
  try {
    if (!domain) {
      console.warn('[ZoomInfo] No domain provided, skipping.');
      return { phone: '', headquarters: '', employees: '', revenue: '' };
    }
    // Clean domain for search
    let cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    await page.bringToFront();
    await humanMouseMove(page);
    await page.goto(`https://www.google.com/search?q=${cleanDomain}+zoominfo`, { waitUntil: 'domcontentloaded' });
    await humanScroll(page);
    let text = await page.textContent('body');
    // Detect Google CAPTCHA or block page
    if (text && (text.includes('Our systems have detected unusual traffic') || text.includes('enable javascript on your web browser') || text.includes('detected requests coming from your computer network'))) {
      console.log('\n[ZoomInfo] CAPTCHA or block detected for', domain, '. Please solve the CAPTCHA in the opened browser window.');
      // Pause and wait for user to solve CAPTCHA
      let solved = false;
      for (let i = 0; i < 60; i++) { // Wait up to 5 minutes
        await page.waitForTimeout(5000);
        text = await page.textContent('body');
        if (text && !text.includes('Our systems have detected unusual traffic') && !text.includes('enable javascript on your web browser') && !text.includes('detected requests coming from your computer network')) {
          solved = true;
          break;
        }
        if (i === 0) console.log('Waiting for CAPTCHA to be solved...');
      }
      if (!solved) {
        console.warn('CAPTCHA was not solved in time. Skipping this lead.');
        return { phone: '', headquarters: '', employees: '', revenue: '' };
      }
      console.log('CAPTCHA solved. Continuing extraction...');
    }
    // Click the first organic search result link (skip ads, Google links)
    // Wait for search results after CAPTCHA
    await page.waitForTimeout(1000);
    let firstResult = await page.$('.yuRUbf > a');
    let clicked = false;
    let linkHref: string | null = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!firstResult) {
        // Try fallback selector
        firstResult = await page.$('a[href^="http"]:not([href*="google"])');
      }
      if (firstResult) {
        try {
          await firstResult.waitForElementState('visible', { timeout: 2000 });
          linkHref = await firstResult.getAttribute('href');
          console.log(`[ZoomInfo] Clicking first organic result: ${linkHref || ''}`);
          await firstResult.click();
          clicked = true;
          break;
        } catch (err) {
          // If element is detached, re-query
          firstResult = await page.$('.yuRUbf > a');
        }
      }
    }
    if (!clicked) {
      // Log the HTML of the results block for debugging
      const resultsHtml = await page.$eval('#search', (el: Element) => (el as HTMLElement).innerHTML).catch(() => '[no #search block]');
      console.warn('[ZoomInfo] No clickable search result found for', cleanDomain, '\n#search HTML:', resultsHtml);
      return { phone: '', headquarters: '', employees: '', revenue: '' };
    }
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give time for page to load
    // Wait for actual ZoomInfo domain to appear in the URL
    let loaded = false;
    for (let i = 0; i < 36; i++) { // Wait up to 3 minutes
      const url = page.url();
      if (url.includes('zoominfo.com')) {
        loaded = true;
        break;
      }
      await page.waitForTimeout(5000);
      if (i === 0) console.log('[ZoomInfo] Waiting for ZoomInfo page to load...');
    }
    if (!loaded) {
      console.warn('[ZoomInfo] ZoomInfo page did not load in time. Please check the browser and solve any challenge. Waiting up to 3 more minutes...');
      let solved = false;
      for (let i = 0; i < 36; i++) {
        const url = page.url();
        if (url.includes('zoominfo.com')) {
          solved = true;
          break;
        }
        await page.waitForTimeout(5000);
      }
      if (!solved) {
        console.warn('[ZoomInfo] ZoomInfo page still did not load. Skipping this lead.');
        return { phone: '', headquarters: '', employees: '', revenue: '' };
      }
    }
    // Pause for manual human verification if needed
    console.log('[ZoomInfo] If you see a human verification or CAPTCHA, please solve it in the browser. Waiting up to 3 minutes...');
    let solved = false;
    for (let i = 0; i < 36; i++) { // Wait up to 3 minutes
      await page.waitForTimeout(5000);
      text = await page.textContent('body');
      if (text && !text.includes('Verify you are human') && !text.includes('Enable JavaScript and cookies to continue')) {
        solved = true;
        break;
      }
      if (i === 0) console.log('Waiting for human verification to be solved...');
    }
    if (!solved) {
      console.warn('[ZoomInfo] Human verification was not solved in time. Skipping this lead.');
      return { phone: '', headquarters: '', employees: '', revenue: '' };
    }
    console.log('\n[ZoomInfo] RAW ZOOMINFO PAGE for', domain, ':\n', text ? text.substring(0, 1000) : '[NO TEXT]');
    const phone = extract(text, /Phone:\s*([+\d\s-]+)/);
    const headquarters = extract(text, /Headquarters:\s*(.*)/);
    const employees = extract(text, /Employees:\s*([\d,]+)/);
    const revenue = extract(text, /Revenue:\s*(\$[\d,.A-Z]+)/);
    console.log('[ZoomInfo] EXTRACTED:', { phone, headquarters, employees, revenue });
    return { phone, headquarters, employees, revenue };
  } catch (e) {
    console.error('[ZoomInfo] Error for domain', domain, e);
    return { phone: '', headquarters: '', employees: '', revenue: '' };
  }
}

async function getEmailPattern(page: Page, domain: string) {
  try {
    if (!domain) {
      console.warn('[RocketReach] No domain provided, skipping.');
      return 'unknown';
    }
    // Clean domain for search
    let cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    await page.goto(`https://www.google.com/search?q=${cleanDomain}+rocketreach`, { waitUntil: 'domcontentloaded' });
    let text = await page.textContent('body');
    // Detect Google CAPTCHA or block page
    if (text && (text.includes('Our systems have detected unusual traffic') || text.includes('enable javascript on your web browser') || text.includes('detected requests coming from your computer network'))) {
      console.log('\n[RocketReach] CAPTCHA or block detected for', domain, '. Please solve the CAPTCHA in the opened browser window.');
      // Pause and wait for user to solve CAPTCHA
      await page.bringToFront();
      let solved = false;
      for (let i = 0; i < 60; i++) { // Wait up to 5 minutes
        await page.waitForTimeout(5000);
        text = await page.textContent('body');
        if (text && !text.includes('Our systems have detected unusual traffic') && !text.includes('enable javascript on your web browser') && !text.includes('detected requests coming from your computer network')) {
          solved = true;
          break;
        }
        if (i === 0) console.log('Waiting for CAPTCHA to be solved...');
      }
      if (!solved) {
        console.warn('CAPTCHA was not solved in time. Skipping this lead.');
        return 'unknown';
      }
      console.log('CAPTCHA solved. Continuing extraction...');
    }
    // Click the first organic search result link (skip ads, Google links)
    // Wait for search results after CAPTCHA
    await page.waitForTimeout(1000);
    let firstResult = await page.$('.yuRUbf > a');
    let clicked = false;
    let linkHref: string | null = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!firstResult) {
        // Try fallback selector
        firstResult = await page.$('a[href^="http"]:not([href*="google"])');
      }
      if (firstResult) {
        try {
          await firstResult.waitForElementState('visible', { timeout: 2000 });
          linkHref = await firstResult.getAttribute('href');
          console.log(`[RocketReach] Clicking first organic result: ${linkHref || ''}`);
          await firstResult.click();
          clicked = true;
          break;
        } catch (err) {
          // If element is detached, re-query
          firstResult = await page.$('.yuRUbf > a');
        }
      }
    }
    if (!clicked) {
      // Log the HTML of the results block for debugging
      const resultsHtml = await page.$eval('#search', (el: Element) => (el as HTMLElement).innerHTML).catch(() => '[no #search block]');
      console.warn('[RocketReach] No clickable search result found for', cleanDomain, '\n#search HTML:', resultsHtml);
      return 'unknown';
    }
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give time for page to load
    // Wait for actual RocketReach domain to appear in the URL
    let loaded = false;
    for (let i = 0; i < 36; i++) { // Wait up to 3 minutes
      const url = page.url();
      if (url.includes('rocketreach.co')) {
        loaded = true;
        break;
      }
      await page.waitForTimeout(5000);
      if (i === 0) console.log('[RocketReach] Waiting for RocketReach page to load...');
    }
    if (!loaded) {
      console.warn('[RocketReach] RocketReach page did not load in time. Please check the browser and solve any challenge. Waiting up to 3 more minutes...');
      let solved = false;
      for (let i = 0; i < 36; i++) {
        const url = page.url();
        if (url.includes('rocketreach.co')) {
          solved = true;
          break;
        }
        await page.waitForTimeout(5000);
      }
      if (!solved) {
        console.warn('[RocketReach] RocketReach page still did not load. Skipping this lead.');
        return 'unknown';
      }
    }
    // Pause for manual human verification if needed
    console.log('[RocketReach] If you see a human verification or CAPTCHA, please solve it in the browser. Waiting up to 3 minutes...');
    let solved = false;
    for (let i = 0; i < 36; i++) { // Wait up to 3 minutes
      await page.waitForTimeout(5000);
      text = await page.textContent('body');
      if (text && !text.includes('Verify you are human') && !text.includes('Enable JavaScript and cookies to continue')) {
        solved = true;
        break;
      }
      if (i === 0) console.log('Waiting for human verification to be solved...');
    }
    if (!solved) {
      console.warn('[RocketReach] Human verification was not solved in time. Skipping this lead.');
      return 'unknown';
    }
    // Try to extract a real email pattern
    const match = text && text.match(/([\w{}._-]+@[\w{}._-]+\.[a-z]+)/i);
    if (match) {
      console.log('[RocketReach] domain:', domain, '| pattern:', match[1]);
      return match[1];
    }
    // Fallback to old patterns
    const patterns = [
      /\{first\}\.\{last\}@/,
      /\{f\}\{last\}@/,
      /\{first\}@/,
      /\{first\}_\{last\}@/
    ];
    for (const p of patterns) {
      if (text?.match(p)) {
        console.log('[RocketReach] domain:', domain, '| fallback pattern:', p.source);
        return p.source;
      }
    }
    console.log('[RocketReach] domain:', domain, '| pattern: unknown');
    return 'unknown';
  } catch (e) {
    console.error('[RocketReach] Error for domain', domain, e);
    return 'unknown';
  }
}

function extract(text: string | null, regex: RegExp) {
  if (!text) return '';
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

// Helper to move mouse randomly
async function humanMouseMove(page: Page) {
  const width = await page.evaluate(() => window.innerWidth);
  const height = await page.evaluate(() => window.innerHeight);
  const x = Math.floor(Math.random() * width * 0.8) + 10;
  const y = Math.floor(Math.random() * height * 0.8) + 10;
  await page.mouse.move(x, y, { steps: 10 + Math.floor(Math.random() * 10) });
  await page.waitForTimeout(200 + Math.random() * 400);
}

// Helper to scroll randomly
async function humanScroll(page: Page) {
  const scrollY = Math.floor(Math.random() * 400);
  await page.mouse.wheel(0, scrollY);
  await page.waitForTimeout(200 + Math.random() * 400);
}

// Enhanced typeSlow with more delay and random mouse move
async function typeSlow(page: Page, selector: string, value: string) {
  await humanMouseMove(page);
  await page.click(selector);
  for (const char of value) {
    await page.keyboard.type(char);
    await page.waitForTimeout(80 + Math.random() * 120); // slower, more random
    if (Math.random() < 0.1) await humanMouseMove(page);
  }
  if (Math.random() < 0.5) await humanScroll(page);
}

// Main runner
(async () => {
  const leads = await readCSV('leads.csv');
  const userDataDir = process.env.CHROME_PROFILE_PATH || 'C:\\Users\\ADMIN\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 8';
  const bravePath = process.env.BRAVE_PATH || 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      slowMo: 40,
      executablePath: bravePath,
    });
    console.log('Using Brave browser at:', bravePath);
  } catch (e) {
    console.warn('Brave not found or failed to launch, falling back to Chrome. Error:', e.message);
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      slowMo: 40,
      channel: 'chrome',
    });
  }
  const buildataPage = await context.newPage();
  await buildataPage.goto('https://buildata.pharosiq.com/contacts', { waitUntil: 'networkidle' });
  await humanMouseMove(buildataPage);
  await humanScroll(buildataPage);
  // No global googlePage; create per-lead

  for (const lead of leads) {
    try {
      // Map fields from CSV using correct columns
      const firstLast = (lead.firstNameLastName || '').split(/,| /).map((s: string) => s.trim()).filter(Boolean);
      const firstName = firstLast[0] || '';
      const lastName = firstLast.length > 1 ? firstLast[firstLast.length - 1] : '';
      const title = lead.title || '';
      const contactLink = lead.contactLink || '';
      let domain = lead.domain || '';
      let company = lead.company || '';
      let linkedinUrl = lead.companyLinkedIn || '';
      if (linkedinUrl && !/\/about\/?$/.test(linkedinUrl)) {
        linkedinUrl = linkedinUrl.replace(/\/+$/, '') + '/about';
      }
      if (!linkedinUrl) linkedinUrl = '';
      // campaignText is already declared above with the new mapping

      // Scrape ZoomInfo and RocketReach
      const googlePage = await context.newPage();
      await googlePage.bringToFront();
      await humanMouseMove(googlePage);
      await googlePage.goto(`https://www.google.com/search?q=${domain}+zoominfo`, { waitUntil: 'domcontentloaded' });
      await humanScroll(googlePage);
      const zoom = await getZoomInfoData(googlePage, domain);
      const emailPattern = await getEmailPattern(googlePage, domain);
      await googlePage.close();

      // Log missing required fields
      if (!emailPattern || emailPattern === 'unknown') {
        console.warn(`Missing or unknown email for company: ${company}, domain: ${domain}`);
      }
      if (!domain) {
        console.warn(`Missing domain for company: ${company}`);
      }
      if (!contactLink) {
        console.warn(`Missing contact link for company: ${company}`);
      }
      if (!company) {
        console.warn(`Missing company name for domain: ${domain}`);
      }
      if (!linkedinUrl) {
        console.warn(`Missing LinkedIn URL for company: ${company}`);
      }

      // Fill Buildata form
      if (buildataPage.isClosed()) {
        throw new Error('Buildata page is closed. Skipping this lead.');
      }
      await buildataPage.bringToFront();
      if (!buildataPage.url().includes('buildata.pharosiq.com/contacts')) {
        await buildataPage.goto('https://buildata.pharosiq.com/contacts', { waitUntil: 'networkidle' });
      }
      // Close modal if present
      const modalSelector = '#myModal';
      const closeModalSelector = '#myModal button.close, #myModal .close, #myModal [data-dismiss="modal"]';
      const modalVisible = await buildataPage.$(modalSelector);
      if (modalVisible) {
        const closeBtn = await buildataPage.$(closeModalSelector);
        if (closeBtn) {
          await closeBtn.click();
          await buildataPage.waitForSelector(modalSelector, { state: 'hidden', timeout: 5000 }).catch(() => {});
        } else {
          // Try pressing Escape if no close button
          await buildataPage.keyboard.press('Escape');
          await buildataPage.waitForTimeout(500);
        }
      }
      // Fill all required fields based on provided HTML structure
      // Prebuild section
      // 1. Select a campaign from the custom dropdown
      // Use updated selector for campaign dropdown button
      await buildataPage.waitForSelector('button.btn-light.dropdown-toggle.form-control', { timeout: 10000 });
      await buildataPage.click('button.btn-light.dropdown-toggle.form-control');
      // Wait for dropdown items to appear
      await buildataPage.waitForSelector('.dropdown-item', { timeout: 5000 });
      // Try to match campaign by visible text from CSV (Column_8_Text or campaign field)
      const campaignText = (lead.campaign || lead['Column_8_Text'] || '').toString().trim();
      let picked = false;
      if (campaignText) {
        const campaignItems = await buildataPage.$$('.dropdown-item');
        for (const item of campaignItems) {
          const text = (await item.textContent())?.trim();
          if (text && text.includes(campaignText)) {
            await item.click();
            picked = true;
            console.log(`Picked campaign by text: ${campaignText}`);
            break;
          }
        }
      }
      // Fallback: pick first if not found
      if (!picked) {
        const campaignItems = await buildataPage.$$('.dropdown-item');
        if (campaignItems.length > 0) {
          await campaignItems[0].click();
          console.log('Picked first campaign as fallback.');
        } else {
          throw new Error('No campaign items found in dropdown');
        }
      }
      // 2. Fill the rest of the form
      await buildataPage.waitForSelector('input#emailaddress', { timeout: 10000 });
      // Use the value from leads.csv column A (First Name, Last Name) if it contains an email, otherwise use the RocketReach pattern
      let actualEmail = '';
      if (lead.firstNameLastName && lead.firstNameLastName.includes('@')) {
        actualEmail = lead.firstNameLastName;
      } else if (emailPattern && emailPattern !== 'unknown') {
        actualEmail = emailPattern;
      }
      await typeSlow(buildataPage, 'input#emailaddress', actualEmail);
      // Click 'Check Email' button
      await buildataPage.click('button:has-text("Check Email")');
      await buildataPage.waitForTimeout(1000); // Wait for validation (adjust if needed)
      // If modal with 'Invalid Email' or 'Check Email' (Please enter a valid email address) appears, click OK
      try {
        // Check for either modal
        const invalidModal = await buildataPage.waitForSelector('.modal-content:has-text("Invalid Email")', { timeout: 2000 });
        if (invalidModal) {
          await buildataPage.click('.modal-content button.btn-info:has-text("OK")');
          await buildataPage.waitForTimeout(500);
          console.log('Clicked OK on Invalid Email modal.');
        }
      } catch (e) {
        // Modal did not appear, continue
      }
      try {
        // Check for the new 'Check Email' modal with 'Please enter a valid email address.'
        const checkEmailModal = await buildataPage.waitForSelector('.modal-content:has-text("Please enter a valid email address.")', { timeout: 2000 });
        if (checkEmailModal) {
          await buildataPage.click('.modal-content button.btn-info:has-text("OK")');
          await buildataPage.waitForTimeout(500);
          console.log('Clicked OK on Check Email modal (Please enter a valid email address).');
        }
      } catch (e) {
        // Modal did not appear, continue
      }

      // Remove trailing slash from domain if present
      let cleanDomain = domain ? domain.replace(/\/+$/, '') : '';
      await typeSlow(buildataPage, 'input#website', cleanDomain);
      // Click 'Check Suppression' button
      await buildataPage.click('button:has-text("Check Suppression")');
      await buildataPage.waitForTimeout(1000);
      // If modal with 'Check Website' appears, click OK
      try {
        const modal = await buildataPage.waitForSelector('.modal-content:has-text("Check Website")', { timeout: 2000 });
        if (modal) {
          await buildataPage.click('.modal-content button.btn-info:has-text("OK")');
          await buildataPage.waitForTimeout(500);
          console.log('Clicked OK on Check Website modal.');
        }
      } catch (e) {
        // Modal did not appear, continue
      }

      await typeSlow(buildataPage, 'input#contactlink', contactLink);
      // Click 'Check Duplicates' button
      await buildataPage.click('button:has-text("Check Duplicates")');
      await buildataPage.waitForTimeout(1000);
      // If modal with 'Check Contact Link' appears, click OK
      try {
        const modal = await buildataPage.waitForSelector('.modal-content:has-text("Check Contact Link")', { timeout: 2000 });
        if (modal) {
          await buildataPage.click('.modal-content button.btn-info:has-text("OK")');
          await buildataPage.waitForTimeout(500);
          console.log('Clicked OK on Check Contact Link modal.');
        }
      } catch (e) {
        // Modal did not appear, continue
      }

      // Load Specifications (optional, before campaign selection)
      try {
        await buildataPage.click('button:has-text("Load Specifications")');
        await buildataPage.waitForTimeout(1000);
      } catch (e) {
        console.log('Load Specifications button not found or not clickable.');
      }
      // Company Profile
      await typeSlow(buildataPage, 'input#company', company);
      // Selects: Employee Range, Revenue Range, Industry, Sub Industry, Seniority, Department
      // Select Employee Range (try to match from CSV or ZoomInfo, else fallback)
      let selects = await buildataPage.$$('select.form-control.form-select');
      if (selects.length > 0) {
        let matched = false;
        const empRange = lead['Employee Range'] || lead['employee_range'] || zoom.employees || '';
        if (empRange) {
          const options = await selects[0].$$('option');
          for (const option of options) {
            const text = (await option.textContent())?.toLowerCase();
            if (text && empRange.toLowerCase().includes(text)) {
              await selects[0].selectOption({ label: text });
              matched = true;
              break;
            }
          }
        }
        if (!matched) await selects[0].selectOption({ index: 1 });
      }
      // Select Revenue Range (second select in row)
      // (do not redeclare selects)
      // Revenue Range (second select): try to match from CSV or ZoomInfo revenue
      if (selects.length > 1) {
        let matched = false;
        const revRange = lead['Revenue Range'] || lead['revenue_range'] || zoom.revenue || '';
        if (revRange) {
          const options = await selects[1].$$('option');
          for (const option of options) {
            const text = (await option.textContent())?.toLowerCase();
            if (text && revRange.toLowerCase().includes(text)) {
              await selects[1].selectOption({ label: text });
              matched = true;
              break;
            }
          }
        }
        if (!matched) await selects[1].selectOption({ index: 1 });
      }
      // Industry (third select in Company Profile)
      if (selects.length > 2) {
        let matched = false;
        const industry = lead['Industry'] || lead['industry'] || '';
        if (industry) {
          const options = await selects[2].$$('option');
          for (const option of options) {
            const text = (await option.textContent())?.toLowerCase();
            if (text && industry.toLowerCase().includes(text)) {
              await selects[2].selectOption({ label: text });
              matched = true;
              break;
            }
          }
        }
        if (!matched) await selects[2].selectOption({ index: 1 });
      }
      // Sub Industry (fourth select)
      if (selects.length > 3) {
        let matched = false;
        const subIndustry = lead['Sub Industry'] || lead['sub_industry'] || '';
        if (subIndustry) {
          const options = await selects[3].$$('option');
          for (const option of options) {
            const text = (await option.textContent())?.toLowerCase();
            if (text && subIndustry.toLowerCase().includes(text)) {
              await selects[3].selectOption({ label: text });
              matched = true;
              break;
            }
          }
        }
        if (!matched) await selects[3].selectOption({ index: 1 });
      }
      // Company LinkedIn URL
      // Always add /about to the LinkedIn company URL
      await typeSlow(buildataPage, 'input#companylinkedinurl', linkedinUrl);
      // Employee Size Verification Link
      await typeSlow(buildataPage, 'input#employeesizeverificationlink', lead['Employee Size Verification Link'] || '');
      // Industry Verification Link
      await typeSlow(buildataPage, 'input#industryverificationurl', lead['Industry Verification Link'] || '');
      // Revenue Verification Link
      await typeSlow(buildataPage, 'input#revenueverificationurl', lead['Revenue Verification Link'] || '');
      // Contact Profile
      await typeSlow(buildataPage, 'input#firstname', firstName);
      await typeSlow(buildataPage, 'input#lastname', lastName);
      await typeSlow(buildataPage, 'input#title', title);
      // Seniority (fifth select)
      if (selects.length > 4) {
        await selects[4].selectOption({ index: 1 });
      }
      // Department (sixth select)
      if (selects.length > 5) {
        await selects[5].selectOption({ index: 1 });
      }
      // Function (seventh select)
      if (selects.length > 6) {
        await selects[6].selectOption({ index: 1 });
      }
      // Specialty (eighth select)
      if (selects.length > 7) {
        await selects[7].selectOption({ index: 1 });
      }
      // Contact Number (country code select and phone input)
      await typeSlow(buildataPage, 'input[name="ContactDto.Phone_work"]', zoom.phone || lead['Phone'] || lead['phone'] || '');
      // Click 'Check' button for phone
      try {
        await buildataPage.click('button:has-text("Check")');
        await buildataPage.waitForTimeout(1000);
      } catch (e) {
        console.log('Check button for phone not found or not clickable.');
      }
      // Street Address
      await typeSlow(buildataPage, 'input#streetaddress', zoom.headquarters || lead['Street Address'] || '');
      await typeSlow(buildataPage, 'input#city', lead['City'] || '');
      await typeSlow(buildataPage, 'input#state', lead['State'] || '');
      await typeSlow(buildataPage, 'input#zip', lead['Zip'] || '');
      // Country (ninth select)
      if (selects.length > 8) {
        await selects[8].selectOption({ index: 1 });
      }
      // Comments
      await buildataPage.fill('textarea#comments', 'Auto-filled by automation script.');
      // Submit the form
      await buildataPage.waitForSelector('button.btn-success[type="submit"]', { timeout: 10000 });
      await buildataPage.click('button.btn-success[type="submit"]');
      await buildataPage.waitForTimeout(1500);
    } catch (err) {
      console.error(`Error processing lead ${lead.company || lead.domain}:`, err);
      // Optionally, reload the page for the next lead
      if (buildataPage && !buildataPage.isClosed()) {
        try {
          await buildataPage.goto('https://buildata.pharosiq.com/contacts', { waitUntil: 'networkidle' });
        } catch {}
      }
      continue;
    }
  }
  await context.close();
})();
