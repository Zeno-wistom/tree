import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
const c = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const p = await c.newPage();
const t0 = Date.now();
await p.goto('http://127.0.0.1:5174/', { waitUntil: 'commit' });
const marks = [];
for (const t of [60, 140, 260, 420, 700, 1200, 2200]) {
  const wait = t - (Date.now() - t0);
  if (wait > 0) await p.waitForTimeout(wait);
  await p.screenshot({ path: `docs/v4/shots/boot-${String(t).padStart(4, '0')}.png` });
  marks.push({ t, shell: await p.evaluate(() => !!document.getElementById('first-frame')) });
}
console.log(JSON.stringify(marks));
await b.close();
