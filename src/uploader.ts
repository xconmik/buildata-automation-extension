import axios from "axios";

export async function uploadToBuildata(payload: any) {
  await axios.post(
    "https://buildata.pharosiq.com/api/contacts",
    payload,
    {
      headers: {
        "Authorization": `Bearer ${process.env.BUILDATA_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}
