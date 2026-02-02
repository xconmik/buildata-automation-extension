import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://buildata.pharosiq.com', { waitUntil: 'networkidle' });
  console.log('Please log in to Buildata in the opened browser window.');
  await page.waitForTimeout(30000); // Wait 30 seconds for manual login
  await context.storageState({ path: 'auth.json' });
  console.log('Login session saved to auth.json. You can now close the browser.');
  await browser.close();
})();
