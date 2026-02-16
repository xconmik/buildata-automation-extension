function isTwoLetterToken(token: string) {
  return /^[A-Za-z]{2}$/.test(token || "");
}

function normalizeToken(token: string) {
  return String(token || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function resolveCompanyName(baseCompany: string, referenceCompany: string) {
  const base = String(baseCompany || "").trim();
  const reference = String(referenceCompany || "").trim();

  if (!base) return reference;
  if (!reference) return base;

  const baseTokens = base.split(/\s+/).filter(Boolean);
  const refTokens = reference.split(/\s+/).filter(Boolean);

  if (baseTokens.length === 1 && isTwoLetterToken(baseTokens[0])) {
    return reference;
  }

  if (baseTokens.length === refTokens.length) {
    let diffCount = 0;
    let replaceableDiff = false;

    for (let index = 0; index < baseTokens.length; index++) {
      const left = normalizeToken(baseTokens[index]);
      const right = normalizeToken(refTokens[index]);
      if (left !== right) {
        diffCount += 1;
        if (isTwoLetterToken(baseTokens[index])) {
          replaceableDiff = true;
        }
      }
    }

    if (diffCount === 1 && replaceableDiff) {
      return reference;
    }
  }

  return base;
}

export function normalizeCompany(row: any) {
  const website = row.Website || row["Domain or Website"] || row.links || "";
  const domain = website
    ?.replace("https://", "")
    ?.replace("http://", "")
    ?.replace("www.", "")
    ?.split("/")[0];

  const baseCompanyName = row.Column_5_Text || row.Company || row.company || "";
  const referenceCompanyName = row["COMPANY NAME"] || row["Company Name"] || "";
  const companyName = resolveCompanyName(baseCompanyName, referenceCompanyName);

  return {
    personName: row.Column_2_Text || row["First Name, Last Name"] || "",
    jobTitle: row.Column_3_Text || row.Title || row.title || "",
    companyName,
    companyDomain: domain,
    linkedinCompany: row["LinkedIn Company"] || row["Company Linkedin URL"] || "",
    location: row.Column_7_Text || row.HQ || row.Location || row.location || "",
    industry: row.Column_8_Text || row.Industry || row.industry || "",
  };
}
