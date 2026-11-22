import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
const base = 'http://localhost:4174/';
for (const [w, h, tag] of [[1366, 768, '1366'], [390, 844, '390']]) {
  const c = await b.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  await p.screenshot({ path: `docs/v4/shots/${tag}-1-idle.png` });
  await p.getByRole('button', { name: '打开校园来信' }).click();
  await p.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'DISCOVER', null, { timeout: 12000 });
  await p.waitForTimeout(900);
  await p.screenshot({ path: `docs/v4/shots/${tag}-2-discover.png` });
  console.log(tag, 'ok', JSON.stringify(errs));
  await c.close();
}
await b.close();
