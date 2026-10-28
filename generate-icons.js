// generate-icons.js
// Creates valid PNG files for PWA manifest requirements
import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, a = 255) {
  // A minimal valid uncompressed/deflated RGBA PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    
    // crc32
    let c = 0xffffffff;
    const combined = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < combined.length; i++) {
      c ^= combined[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    crcBuf.writeInt32BE(~c, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw image data with filter byte 0 per line
  const rowBytes = width * 4;
  const raw = Buffer.alloc((1 + rowBytes) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + rowBytes);
    raw[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Gradient / border calculation
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.hypot(x - cx, y - cy) / (width / 2);
      
      if (dist < 0.9) {
        // Deep purple to indigo gradient
        const t = (x + y) / (width + height);
        raw[pxOffset] = Math.floor(15 * (1 - t) + 99 * t);     // R
        raw[pxOffset + 1] = Math.floor(23 * (1 - t) + 102 * t); // G
        raw[pxOffset + 2] = Math.floor(42 * (1 - t) + 241 * t); // B
        raw[pxOffset + 3] = 255;
      } else {
        raw[pxOffset] = 15;
        raw[pxOffset + 1] = 23;
        raw[pxOffset + 2] = 42;
        raw[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, 30, 41, 59));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, 30, 41, 59));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512, 15, 23, 42));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, 30, 41, 59));
fs.writeFileSync('public/favicon.ico', createPNG(32, 32, 30, 41, 59));
console.log('Icons generated successfully!');
