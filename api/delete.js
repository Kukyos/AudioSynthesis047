// Remove one take from the shared store. Anyone with the team key can do this —
// the team is three people, and a bad take that nobody can delete is worse.
import { del } from "@vercel/blob";
import { blobToken, guard } from "./_token.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!guard(req, res)) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const target = (body || {}).url || (body || {}).pathname;
  if (!target) return res.status(400).json({ error: "no url or pathname" });

  await del(target, { token: blobToken() });
  return res.status(200).json({ deleted: target });
}
