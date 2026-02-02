import axios from "axios";
import fs from "fs";

const client = axios.create({
  baseURL: "https://buildata.pharosiq.com",
  headers: {
    Authorization: `Bearer ${process.env.BUILDATA_TOKEN}`,
    "Content-Type": "application/json",
  },
});

export async function checkEmail(email: string) {
  const res = await client.post("/api/email/check", { email });
  return res.data;
}

export async function checkSuppression(email: string) {
  const res = await client.post("/api/suppression/check", { email });
  return res.data;
}

export async function checkDuplicate(email: string) {
  const res = await client.post("/api/contacts/duplicate", { email });
  return res.data;
}

export async function createContact(payload: any) {
  const res = await client.post("/api/contacts", payload);
  return res.data;
}

export function logFailedRow({ email, company, error_reason, endpoint }: any) {
  const row = `"${email}","${company}","${error_reason}","${endpoint}"
`;
  fs.appendFileSync("failed_rows.csv", row);
}
