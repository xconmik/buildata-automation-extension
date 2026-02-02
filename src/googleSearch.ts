import axios from "axios";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const GOOGLE_CX = process.env.GOOGLE_CX!;

export async function googleSearch(query: string) {
  const res = await axios.get(
    "https://www.googleapis.com/customsearch/v1",
    {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CX,
        q: query,
      },
    }
  );

  return res.data.items || [];
}
