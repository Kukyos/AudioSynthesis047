// Everything the team has uploaded, so every browser can show shared progress.
import { list } from "@vercel/blob";
import { blobToken, guard } from "./_token.js";

export default async function handler(req, res) {
  if (!guard(req, res)) return;

  const token = blobToken();
  const blobs = [];
  let cursor;
  do {
    const page = await list({ cursor, limit: 1000, token });
    blobs.push(...page.blobs.map((b) => ({ pathname: b.pathname, url: b.url, size: b.size })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  res.setHeader("cache-control", "no-store");
  return res.status(200).json({ blobs });
}
