// Normalization and mapping helpers for Buildata payload

export function splitName(fullName: string) {
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(" ");
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || "",
  };
}

export function inferSeniority(title: string) {
  if (!title) return "";
  const t = title.toLowerCase();
  if (t.includes("vp")) return "Vice President";
  if (t.includes("head")) return "Head";
  if (t.includes("director")) return "Director";
  if (t.includes("manager")) return "Manager";
  return "Individual Contributor";
}

export function inferDepartment(title: string) {
  if (!title) return "Other";
  const t = title.toLowerCase();
  if (t.includes("it")) return "IT";
  if (t.includes("operation")) return "Operations";
  if (t.includes("engineering")) return "Engineering";
  if (t.includes("marketing")) return "Marketing";
  return "Other";
}

export function mapToBuildataPayload({
  company,
  enrichment,
  campaign = "Germany Operations Leaders",
  email,
  linkedinProfile,
  zoomInfoUrl = null
}: any) {
  const { firstName, lastName } = splitName(company.personName);
  return {
    prebuild: {
      campaign,
      email,
      domain: company.companyDomain,
      contact_link: linkedinProfile,
    },
    contact_profile: {
      first_name: firstName,
      last_name: lastName,
      title: company.jobTitle,
      seniority: inferSeniority(company.jobTitle),
      department: inferDepartment(company.jobTitle),
      function: inferDepartment(company.jobTitle), // can be improved
      specialty: null,
      contact_number: enrichment.phone,
      street_address: enrichment.headquarters,
      city: null, // can parse from headquarters if needed
      state: null,
      zip_code: null,
      country: company.location,
      comments: "Auto-enriched via ZoomInfo & RocketReach",
    },
    company_profile: {
      company_name: company.companyName,
      employee_range: enrichment.employees,
      revenue_range: enrichment.revenue,
      sic_code: null,
      naics_code: null,
      industry: company.industry,
      sub_industry: null,
      company_linkedin_url: company.linkedinCompany,
      employee_size_verification_link: zoomInfoUrl,
      industry_verification_link: zoomInfoUrl,
      naics_sic_revenue_verification_link: zoomInfoUrl,
    },
  };
}
