

export function extractZoomInfo(snippets: any[]) {
  const text = snippets.map(i => i.snippet).join(" ");

  return {
    phone: match(text, /Phone[:\s]+([\d\-+() ]+)/),
    headquarters: match(text, /Headquarters[:\s]+([A-Za-z ,]+)/),
    employees: match(text, /Employees[:\s]+([\d,]+)/),
    revenue: match(text, /Revenue[:\s]+([\$A-Za-z0-9 ,.]+)/),
  };
}

export function extractEmailPattern(snippets: any[]) {
  const text = snippets.map(i => i.snippet).join(" ");
  return match(text, /Email Pattern[:\s]+(.+)/);
}

function match(text: string, regex: RegExp) {
  const m = text.match(regex);
  return m ? m[1].trim() : null;
}
