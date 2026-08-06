/**
 * Generates 100% valid binary PNG icon & screenshot files for PWA manifest & app store packaging.
 * Sizes: 48x48, 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512.
 * Screenshots: 540x960 (mobile narrow), 1280x720 (desktop wide).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function generatePng(w, h, isScreenshot = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8; // bit depth: 8
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const rowLen = 1 + w * 3;
  const raw = Buffer.alloc(h * rowLen);
  for (let y = 0; y < h; y++) {
    const offset = y * rowLen;
    raw[offset] = 0; // Filter: None
    const t = y / h;
    for (let x = 0; x < w; x++) {
      const borderSize = Math.max(2, Math.floor(Math.min(w, h) * 0.03));
      const isBorder = x < borderSize || x >= w - borderSize || y < borderSize || y >= h - borderSize;

      let r, g, b;
      if (isBorder) {
        r = 30; g = 41; b = 59; // Dark border #1e293b
      } else if (isScreenshot) {
        // Slate-900 background #0f172a with subtle indigo gradient
        r = Math.round(15 + t * 20);
        g = Math.round(23 + t * 25);
        b = Math.round(42 + t * 40);
      } else {
        // Indigo gradient #6C63FF to #4F46E5
        r = Math.round(108 - t * 29);
        g = Math.round(99 - t * 29);
        b = Math.round(255 - t * 26);
      }
      raw[offset + 1 + x * 3 + 0] = r;
      raw[offset + 1 + x * 3 + 1] = g;
      raw[offset + 1 + x * 3 + 2] = b;
    }
  }
  const idat = makeChunk('IDAT', zlib.deflateSync(raw));
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

const outDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sizes = [48, 72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  const png = generatePng(size, size, false);
  const filePath = path.join(outDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`[PWA Icon Generator] Created ${filePath} (${size}x${size} PNG)`);
});

const screenshotDir = path.join(__dirname, '../public/screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

fs.writeFileSync(path.join(screenshotDir, 'mobile-1.png'), generatePng(540, 960, true));
fs.writeFileSync(path.join(screenshotDir, 'desktop-1.png'), generatePng(1280, 720, true));
console.log('[PWA Screenshot Generator] Created mobile-1.png and desktop-1.png screenshots!');
