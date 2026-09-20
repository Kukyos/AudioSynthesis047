// POST {name, contentType, data: base64} -> stores one take in Vercel Blob.
//
// Base64 in JSON rather than a raw body: a take is ~30 KB, the 33% overhead is
// nothing, and it sidesteps every question about how the runtime parsed the body.
import { put } from "@vercel/blob";
import { blobToken, guard } from "./_token.js";

// lang/index_speaker_timestamp.ext — the timestamp is what keeps two takes apart.
const NAME = /^(en|hi)\/\d{3}_[a-z0-9-]{1,40}_\d{13}\.(webm|m4a|ogg)$/;
const LIMIT = 4_000_000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!guard(req, res)) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { name, contentType, data } = body || {};
  if (!NAME.test(name || "")) return res.status(400).json({ error: `bad name: ${name}` });

  const bytes = Buffer.from(data || "", "base64");
  if (!bytes.length) return res.status(400).json({ error: "empty take" });
  if (bytes.length > LIMIT) return res.status(413).json({ error: "take too large" });

  const blob = await put(name, bytes, {
    access: "public",
    addRandomSuffix: false,
    contentType: contentType || "audio/webm",
    token: blobToken(),
  });
  return res.status(200).json({ url: blob.url, pathname: blob.pathname });
}
