import fs from "fs";
import csv from "csv-parser";
import type { CSVRow } from "./types.ts";

function getCompanyName(row: CSVRow) {
  return row.Column_5_Text || row["COMPANY NAME"] || row["Company Name"] || row.Company || row.company || "";
}

function getWebsite(row: CSVRow) {
  return row.Website || row["Domain or Website"] || row.links || "";
}

export function readCSV(path: string): Promise<CSVRow[]> {
  return new Promise((resolve) => {
    const results: CSVRow[] = [];

    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (row) => {
        const company = getCompanyName(row);
        const website = getWebsite(row);

        // Keep rows that at least have a company name (Dispotracker-compatible)
        if (company || website) {
          results.push(row);
        }
      })
      .on("end", () => resolve(results));
  });
}
