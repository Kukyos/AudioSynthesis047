// Store-only ZIP writer. No compression: the clips are already compressed audio, so
// deflate would spend CPU to save nothing.
//
// Self-test: node zip.test.js
(function (root) {
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // DOS timestamp. Anything before 1980 is unrepresentable, so clamp.
  function dosTime(date) {
    const year = Math.max(1980, date.getFullYear());
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    };
  }

  function header(size) {
    const buf = new Uint8Array(size);
    const view = new DataView(buf.buffer);
    let off = 0;
    return {
      buf,
      u16(v) { view.setUint16(off, v, true); off += 2; },
      u32(v) { view.setUint32(off, v >>> 0, true); off += 4; },
      bytes(b) { buf.set(b, off); off += b.length; },
    };
  }

  /**
   * files: [{ name: "en/001.webm", data: Uint8Array }]
   * Returns a Blob. Names must be unique and use forward slashes.
   */
  function makeZip(files, now) {
    const stamp = dosTime(now || new Date());
    const encoder = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;

    for (const file of files) {
      const name = encoder.encode(file.name);
      const data = file.data;
      const crc = crc32(data);

      const local = header(30 + name.length);
      local.u32(0x04034b50);
      local.u16(20);      // version needed
      local.u16(0x0800);  // UTF-8 filename
      local.u16(0);       // stored
      local.u16(stamp.time);
      local.u16(stamp.date);
      local.u32(crc);
      local.u32(data.length);
      local.u32(data.length);
      local.u16(name.length);
      local.u16(0);       // no extra field
      local.bytes(name);
      parts.push(local.buf, data);

      const entry = header(46 + name.length);
      entry.u32(0x02014b50);
      entry.u16(20);      // version made by
      entry.u16(20);      // version needed
      entry.u16(0x0800);
      entry.u16(0);
      entry.u16(stamp.time);
      entry.u16(stamp.date);
      entry.u32(crc);
      entry.u32(data.length);
      entry.u32(data.length);
      entry.u16(name.length);
      entry.u16(0);       // extra
      entry.u16(0);       // comment
      entry.u16(0);       // disk number
      entry.u16(0);       // internal attrs
      entry.u32(0);       // external attrs
      entry.u32(offset);
      entry.bytes(name);
      central.push(entry.buf);

      offset += local.buf.length + data.length;
    }

    const centralSize = central.reduce((n, b) => n + b.length, 0);
    const end = header(22);
    end.u32(0x06054b50);
    end.u16(0);
    end.u16(0);
    end.u16(files.length);
    end.u16(files.length);
    end.u32(centralSize);
    end.u32(offset);
    end.u16(0);

    return new Blob([...parts, ...central, end.buf], { type: "application/zip" });
  }

  root.makeZip = makeZip;
  root.crc32 = crc32;
})(typeof window !== "undefined" ? window : globalThis);
