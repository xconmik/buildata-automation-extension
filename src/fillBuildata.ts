export async function typeSlow(page, selector, value) {
  await page.click(selector);
  for (const char of value) {
    await page.keyboard.type(char);
    await page.waitForTimeout(40 + Math.random() * 40);
  }
}

export async function fillBuildata(page, lead, zoom, emailPattern) {
  // Wait for Add Contact button to be visible
  await page.waitForSelector('text=Add Contact', { timeout: 10000 });
  await page.click('text=Add Contact');
  await typeSlow(page, 'input[name="domain"]', lead.domain);
  await typeSlow(page, 'input[name="phone"]', zoom.phone);
  await typeSlow(page, 'input[name="headquarters"]', zoom.headquarters);
  await typeSlow(page, 'input[name="employees"]', zoom.employees);
  await typeSlow(page, 'input[name="revenue"]', zoom.revenue);
  await typeSlow(page, 'input[name="emailPattern"]', emailPattern);
  // Wait for Save button and click
  await page.waitForSelector('button:has-text("Save")', { timeout: 10000 });
  await page.click('button:has-text("Save")');
}
}
