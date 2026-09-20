// Everything the team has uploaded, so every browser can show shared progress.
import { list } from "@vercel/blob";

export default async function handler(req, res) {
  const key = process.env.UPLOAD_KEY;
  if (!key) return res.status(500).json({ error: "UPLOAD_KEY is not set on this deployment" });
  if (req.headers["x-upload-key"] !== key) return res.status(401).json({ error: "wrong key" });

  const blobs = [];
  let cursor;
  do {
    const page = await list({ cursor, limit: 1000 });
    blobs.push(...page.blobs.map((b) => ({ pathname: b.pathname, url: b.url, size: b.size })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  res.setHeader("cache-control", "no-store");
  return res.status(200).json({ blobs });
}
