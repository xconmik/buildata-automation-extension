import fs from "fs";
import csv from "csv-parser";
import type { CSVRow } from "./types.ts";

export function readCSV(path: string): Promise<CSVRow[]> {
  return new Promise((resolve) => {
    const results: CSVRow[] = [];

    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (row) => {
        // Skip rows without company website and company name
        if (row.Website && row.Column_5_Text) {
          results.push(row);
        }
      })
      .on("end", () => resolve(results));
  });
}
