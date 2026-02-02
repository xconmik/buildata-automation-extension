export function normalizeCompany(row: any) {
  const domain = row.Website
    ?.replace("https://", "")
    ?.replace("http://", "")
    ?.replace("www.", "")
    ?.split("/")[0];

  return {
    personName: row.Column_2_Text,
    jobTitle: row.Column_3_Text,
    companyName: row.Column_5_Text,
    companyDomain: domain,
    linkedinCompany: row["LinkedIn Company"],
    location: row.Column_7_Text,
    industry: row.Column_8_Text,
  };
}
