import { chromium } from '@playwright/test';
import zlib from 'node:zlib';
function decode(buf) {
  let off = 8, w = 0, h = 0, ct = 6; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp;
  const out = Buffer.alloc(h * stride); let pos = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[pos++], line = raw.subarray(pos, pos + stride); pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      cur[x] = v & 255;
    }
  }
  return { w, h, bpp, data: out };
}
const url = process.argv[2] || 'http://127.0.0.1:5174/';
const b = await chromium.launch({ channel: 'msedge' });
const c = await b.newContext({ viewport: { width: 1280, height: 800 } });
const p1 = await c.newPage();
await p1.route('**/src/main.tsx', r => r.abort());
await p1.route('**/assets/index-*.js', r => r.abort());
await p1.goto(url, { waitUntil: 'domcontentloaded' });
await p1.waitForTimeout(900);
const shellShot = await p1.screenshot({ path: 'docs/v4/shots/diff-shell.png' });
await p1.close();
const p2 = await c.newPage();
await p2.goto(url, { waitUntil: 'networkidle' });
await p2.waitForTimeout(1800);
const appShot = await p2.screenshot({ path: 'docs/v4/shots/diff-app.png' });
const a = decode(shellShot), z = decode(appShot);
let sum = 0, n = 0, big = 0;
for (let i = 0; i < a.w * a.h; i++) {
  const o = i * a.bpp;
  const dv = Math.abs(a.data[o] - z.data[o]) + Math.abs(a.data[o + 1] - z.data[o + 1]) + Math.abs(a.data[o + 2] - z.data[o + 2]);
  sum += dv; n += 3;
  if (dv > 30) big++;
}
console.log('mean abs diff', (sum / n).toFixed(2), 'pixels >10/channel:', (big / (a.w * a.h) * 100).toFixed(2) + '%');
await b.close();
