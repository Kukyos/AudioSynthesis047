// node zip.test.js  — builds a zip, then has python's zipfile verify it.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

require("./zip.js");

(async () => {
  // Known CRC-32 of "123456789".
  assert.strictEqual(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);

  const enc = new TextEncoder();
  const files = [
    { name: "en/001.webm", data: enc.encode("hello clip one") },
    { name: "hi/002.webm", data: new Uint8Array([0, 1, 2, 250, 251, 255]) },
    { name: "hi/नाम.txt", data: enc.encode("देवनागरी") },
  ];
  const blob = makeZip(files, new Date(2026, 8, 20, 12, 30, 0));
  const zipPath = path.join(os.tmpdir(), "cliptest.zip");
  fs.writeFileSync(zipPath, Buffer.from(await blob.arrayBuffer()));

  const script = `
import zipfile
z = zipfile.ZipFile(r"${zipPath}")
assert z.testzip() is None, "corrupt member"
names = z.namelist()
assert names == ["en/001.webm", "hi/002.webm", "hi/\\u0928\\u093e\\u092e.txt"], names
assert z.read(names[0]) == b"hello clip one"
assert z.read(names[1]) == bytes([0, 1, 2, 250, 251, 255])
assert z.read(names[2]).decode() == "\\u0926\\u0947\\u0935\\u0928\\u093e\\u0917\\u0930\\u0940"
assert z.getinfo(names[0]).date_time == (2026, 9, 20, 12, 30, 0), z.getinfo(names[0]).date_time
print("python zipfile: 3 members, names, bytes and timestamp all good")
`;
  process.stdout.write(execFileSync("python", ["-c", script], { encoding: "utf-8" }));
  fs.unlinkSync(zipPath);
  console.log("zip.test.js ok");
})();
