import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
await p.getByRole('button', { name: '打开校园来信' }).click();
await p.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'DISCOVER', null, { timeout: 15000 });
await p.waitForTimeout(1500);
await p.screenshot({ path: 'docs/v4/shots/discover-still.png' });
const geo = await p.evaluate(() => {
  const r = s => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  return { layer: r('.env-layer'), flap: r('.env-flap'), card: r('.fan-card'), pocket: r('.pocket-shape'), head: r('.discover-head') };
});
console.log(JSON.stringify(geo), errs);
await b.close();
