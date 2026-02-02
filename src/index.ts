import "dotenv/config";
import { readCSV } from "./csvReader.ts";
import { normalizeCompany } from "./normalize.ts";
import { googleSearch } from "./googleSearch.ts";
import { extractZoomInfo, extractEmailPattern } from "./extractors.ts";
import { mapToBuildataPayload } from "./mapping.ts";
import { checkEmail, checkSuppression, checkDuplicate, createContact, logFailedRow } from "./buildataClient.ts";

async function main() {
  const rows = await readCSV("data/input.csv");

  for (const row of rows) {
    const company = normalizeCompany(row);
    console.log("\n--- Processing company:", company.companyName, "---");

    // Enrichment
    console.log("[1] Enriching with ZoomInfo...");
    const zoom = await googleSearch(
      `site:zoominfo.com \"${company.companyName}\" \"${company.companyDomain}\"`
    );
    console.log("[1] ZoomInfo results:", JSON.stringify(zoom, null, 2));

    console.log("[2] Enriching with RocketReach...");
    const rocket = await googleSearch(
      `site:rocketreach.co \"${company.companyDomain}\" email pattern`
    );
    console.log("[2] RocketReach results:", JSON.stringify(rocket, null, 2));

    const enrichment = extractZoomInfo(zoom);
    const emailPattern = extractEmailPattern(rocket);
    console.log("[3] Extracted enrichment:", enrichment);
    console.log("[3] Extracted email pattern:", emailPattern);

    // Use RocketReach or fallback for email
    const email = emailPattern || null;
    const linkedinProfile = row.Column_4_URL || null;
    console.log("[4] Email:", email);
    console.log("[4] LinkedIn Profile:", linkedinProfile);

    // Buildata API validation pipeline
    try {
      if (!email) throw new Error("No email found");
      console.log("[5] Checking email...");
      await checkEmail(email);
      console.log("[5] Email check passed.");
    } catch (e) {
      console.error("[5] Email check failed:", e.message || e);
      logFailedRow({ email, company: company.companyName, error_reason: `Email check failed: ${e.message || e}`, endpoint: "/api/email/check" });
      continue;
    }
    try {
      console.log("[6] Checking suppression...");
      await checkSuppression(email);
      console.log("[6] Suppression check passed.");
    } catch (e) {
      console.error("[6] Suppression check failed:", e.message || e);
      logFailedRow({ email, company: company.companyName, error_reason: `Suppression check failed: ${e.message || e}`, endpoint: "/api/suppression/check" });
      continue;
    }
    try {
      console.log("[7] Checking duplicates...");
      await checkDuplicate(email);
      console.log("[7] Duplicate check passed.");
    } catch (e) {
      console.error("[7] Duplicate check failed:", e.message || e);
      logFailedRow({ email, company: company.companyName, error_reason: `Duplicate check failed: ${e.message || e}`, endpoint: "/api/contacts/duplicate" });
      continue;
    }

    // Map to Buildata payload
    const payload = mapToBuildataPayload({
      company,
      enrichment,
      email,
      linkedinProfile,
      // Optionally add campaign, zoomInfoUrl, etc.
    });
    console.log("[8] Final Buildata payload:", JSON.stringify(payload, null, 2));

    try {
      console.log("[9] Creating contact in Buildata...");
      await createContact(payload);
      console.log("[9] Uploaded:", company.companyName);
    } catch (e) {
      console.error("[9] Create contact failed:", e.message || e);
      logFailedRow({ email, company: company.companyName, error_reason: `Create contact failed: ${e.message || e}`, endpoint: "/api/contacts" });
    }
  }
}

main();
