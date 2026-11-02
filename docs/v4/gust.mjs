import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await p.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
await p.screenshot({ path: 'docs/v4/shots/idle-0.png' });
// wait for the first gust and sample frames
for (let i = 0; i < 26; i++) {
  await p.waitForTimeout(220);
  const curl = await p.evaluate(() => {
    const el = document.querySelector('.seal-tail');
    const t = el ? getComputedStyle(el).transform : '';
    const leaf = document.querySelector('.leaf-1');
    return { t, leaf: leaf ? getComputedStyle(leaf).opacity : '', wind: getComputedStyle(document.querySelector('.wind-svg')).opacity };
  });
  if (parseFloat(curl.wind) > 0.15 || parseFloat(curl.leaf) > 0.15) {
    console.log(i, JSON.stringify(curl));
    await p.screenshot({ path: `docs/v4/shots/gust-${String(i).padStart(2, '0')}.png` });
  }
}
await b.close();
