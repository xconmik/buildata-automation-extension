import fs from 'fs';
import csv from 'csv-parser';

export type Lead = {
  company: string;
  domain: string;
};

export function readCSV(path: string): Promise<Lead[]> {
  return new Promise((resolve) => {
    const results: Lead[] = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on('data', (row) => {
        results.push({
          company: row.company_name,
          domain: row.domain
        });
      })
      .on('end', () => resolve(results));
  });
}
