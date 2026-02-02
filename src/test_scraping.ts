import { chromium } from 'playwright';


async function getZoomInfoData(page, domain) {
  // Option 1: Try to extract from ZoomInfo company page (if navigated directly)
  try {
    await page.waitForSelector('div.icon-label:has-text("Headquarters")', { timeout: 5000 });
    const headquarters = await page.textContent('div.icon-label:has-text("Headquarters") ~ span.content');
    const phone = await page.textContent('div.icon-label:has-text("Phone Number") ~ span.content');
    const revenue = await page.textContent('div.icon-label:has-text("Revenue") ~ span.content');
    const industry = await page.textContent('div.icon-label:has-text("Industry") ~ span#company-chips-wrapper');
    const subtitle = await page.textContent('p.company-header-subtitle');
    // Extract employee number from subtitle, e.g., "10K+ Employees"
    let employees = '';
    if (subtitle) {
      const match = subtitle.match(/([\d,.KMB+]+)\s*Employees/i);
      if (match) employees = match[1].trim();
    }
    // ...existing code...
    return {
      headquarters: headquarters?.trim() || '',
      phone: phone?.trim() || '',
      revenue: revenue?.trim() || '',
      industry: industry?.trim() || '',
      employees
    };
  } catch (e) {
    // Option 2: Fallback to Google snippet extraction
    const text = await page.textContent('body');
    // ...existing code...
    return {
      phone: extract(text, /([+\d][\d\s\-().]{7,})/),
      headquarters: extract(text, /(Headquarters|Address|Location)[:\s]*([A-Za-z0-9, .-]+)/i),
      employees: extract(text, /(\d{2,}[,\d]*)\s+(employees|staff|people)/i),
      revenue: extract(text, /(\$[\d,.]+(\s*(million|billion|thousand|M|B))?)/i)
    };
  }
}



async function getEmailPattern(page, domain) {
  await page.goto(`https://www.google.com/search?q=${domain}+rocketreach`, { waitUntil: 'domcontentloaded' });
  // Try to go directly to the RocketReach company email format page if possible
  // If not, let user manually navigate for now
  // Wait for the table to appear
  try {
    await page.waitForSelector('.company-format .table-wpr table', { timeout: 5000 });
    const pattern = await page.textContent('.company-format .table-wpr table tr:first-child td:first-child');
    const example = await page.textContent('.company-format .table-wpr table tr:first-child td:nth-child(2)');
    // ...existing code...
    return pattern?.trim() || 'unknown';
  } catch (e) {
    // Fallback: try to extract from Google snippet
    const text = await page.textContent('body');
    // ...existing code...
    const match = text && text.match(/([\w{}._-]+@[\w{}._-]+\.[a-z]+)/i);
    if (match) return match[1];
    // Fallback to old patterns
    const patterns = [
      /\{first\}\.\{last\}@/,
      /\{f\}\{last\}@/,
      /\{first\}@/,
      /\{first\}_\{last\}@/
    ];
    for (const p of patterns) {
      if (text?.match(p)) return p.source;
    }
    return 'unknown';
  }
}

function extract(text, regex) {
  if (!text) return '';
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}


import fs from 'fs';
import csv from 'csv-parser';

async function readCSV(path) {
  return new Promise((resolve) => {
    const results = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => resolve(results));
  });
}

 (async () => {
  const leads = await readCSV('./leads.csv');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  for (const lead of leads.slice(0, 5)) { // Test first 5 leads for demo
    const domain = lead['Website'] || lead['domain'] || lead['website'];
    if (!domain) continue;
    const zoom = await getZoomInfoData(page, domain);
    const emailPattern = await getEmailPattern(page, domain);
    // Print only the extracted fields in a concise format
    console.log('==============================');
    console.log(`Domain: ${domain}`);
    if (zoom) {
      console.log('ZoomInfo:');
      console.log(`  Headquarters: ${zoom.headquarters}`);
      console.log(`  Phone: ${zoom.phone}`);
      console.log(`  Revenue: ${zoom.revenue}`);
      console.log(`  Industry: ${zoom.industry}`);
      console.log(`  Employees: ${zoom.employees}`);
    }
    console.log(`RocketReach Email Pattern: ${emailPattern}`);
    console.log('==============================\n');
  }

  await browser.close();
})();
