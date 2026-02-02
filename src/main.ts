import { chromium } from 'playwright';
import { readCSV } from './csv.ts';
import { getZoomInfoData, getEmailPattern } from './googleScraper.ts';
import { fillBuildata } from './fillBuildata.ts';


(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 40 });
  const context = await browser.newContext({ storageState: 'auth.json' });
  // Main Buildata page
  const buildataPage = await context.newPage();
  await buildataPage.goto('https://buildata.pharosiq.com/contacts', { waitUntil: 'networkidle' });

  // Google scraping page (separate tab)
  const googlePage = await context.newPage();

  const leads = await readCSV('./leads.csv');

  for (const lead of leads) {
    const zoom = await getZoomInfoData(googlePage, lead.domain);
    const emailPattern = await getEmailPattern(googlePage, lead.domain);
    // Always return to Buildata tab before filling
    await buildataPage.bringToFront();
    // Ensure on correct page
    try {
      if (!buildataPage.url().includes('buildata.pharosiq.com/contacts')) {
        await buildataPage.goto('https://buildata.pharosiq.com/contacts', { waitUntil: 'networkidle' });
      }
      await fillBuildata(buildataPage, lead, zoom, emailPattern);
    } catch (err) {
      console.error('Error during Buildata automation for', lead.domain, err);
      // Optionally, continue to next lead
    }
    await buildataPage.waitForTimeout(1500);
  }

  await browser.close();
})();
