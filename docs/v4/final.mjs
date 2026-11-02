import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await p.goto('http://localhost:4174/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.screenshot({ path: 'docs/v4/shots/01-idle.png' });
await p.getByRole('button', { name: '打开校园来信' }).click();
for (const [t, name] of [[260, 'open-a'], [420, 'open-b'], [620, 'open-c'], [900, 'open-d'], [1200, 'open-e'], [1600, 'open-f']]) {
  await p.waitForTimeout(t === 260 ? 260 : 180);
  await p.screenshot({ path: `docs/v4/shots/${name}.png` });
}
await p.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'DISCOVER', null, { timeout: 12000 });
await p.waitForTimeout(900);
await p.screenshot({ path: 'docs/v4/shots/02-discover.png' });
await b.close();
