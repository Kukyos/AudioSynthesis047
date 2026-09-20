// The SDK reads BLOB_READ_WRITE_TOKEN by itself, but a Blob store connected with a
// custom prefix injects e.g. AAPKA_READ_WRITE_TOKEN instead. Find whichever exists so
// the deployment works either way.
export function blobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN"));
  return key ? process.env[key] : undefined;
}

export function guard(req, res) {
  const key = process.env.UPLOAD_KEY;
  if (!key) {
    res.status(500).json({ error: "UPLOAD_KEY is not set on this deployment" });
    return false;
  }
  if (req.headers["x-upload-key"] !== key) {
    res.status(401).json({ error: "wrong key" });
    return false;
  }
  if (!blobToken()) {
    res.status(500).json({ error: "no blob token - connect the Blob store to this project" });
    return false;
  }
  return true;
}
