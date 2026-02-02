export async function getZoomInfoData(page, domain: string) {
  await page.goto(`https://www.google.com/search?q=${domain}+zoominfo`, { waitUntil: 'domcontentloaded' });
  const text = await page.textContent('body');
  return {
    phone: extract(text, /Phone:\s*([+\d\s-]+)/),
    headquarters: extract(text, /Headquarters:\s*(.*)/),
    employees: extract(text, /Employees:\s*([\d,]+)/),
    revenue: extract(text, /Revenue:\s*(\$[\d,.A-Z]+)/)
  };
}

export async function getEmailPattern(page, domain: string) {
  await page.goto(`https://www.google.com/search?q=${domain}+rocketreach`, { waitUntil: 'domcontentloaded' });
  const text = await page.textContent('body');
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

function extract(text: string | null, regex: RegExp) {
  if (!text) return '';
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}
