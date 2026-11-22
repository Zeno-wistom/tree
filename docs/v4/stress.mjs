import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
const c = await b.newContext({ viewport: { width: 1440, height: 810 } });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push('ERR ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const phase = () => p.evaluate(() => document.querySelector('.v4')?.getAttribute('data-phase'));
const busy = () => p.evaluate(() => document.querySelector('.v4')?.getAttribute('data-busy'));
const log = async (label) => console.log(label.padEnd(24), await phase(), 'busy=', await busy());

await p.goto('http://localhost:4174/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await log('idle');

// 1. rapid triple click on open
await p.getByRole('button', { name: '打开校园来信' }).click({ clickCount: 3, delay: 40 }).catch(() => {});
await p.waitForTimeout(60);
await p.getByRole('button', { name: '打开校园来信' }).click({ force: true }).catch(() => {});
await p.waitForTimeout(2600);
await log('after rapid open');

// 2. filters
for (const name of ['澳门大学', '澳门理工大学', '全部来信']) {
  await p.getByRole('button', { name, exact: true }).click();
  await p.waitForTimeout(700);
}
await log('after filters');
const cards = await p.evaluate(() => document.querySelectorAll('.fan-card').length);
console.log('cards', cards);

// 3. hover focus then open
await p.locator('.fan-card').nth(1).hover();
await p.waitForTimeout(500);
await p.screenshot({ path: 'docs/v4/shots/stress-focus.png' });
await p.locator('.fan-card').nth(1).locator('.card-hit').click();
await p.waitForTimeout(1800);
await log('detail');

// 4. back
await p.getByRole('button', { name: /放回来信/ }).click();
await p.waitForTimeout(1400);
await log('back to discover');

// 5. open again -> postcard -> back -> detail
await p.locator('.fan-card').nth(0).hover();
await p.waitForTimeout(400);
await p.locator('.fan-card').nth(0).locator('.card-hit').click();
await p.waitForTimeout(2200);
await p.getByRole('button', { name: /抽出纪念明信片/ }).click();
await p.waitForTimeout(1500);
await log('postcard');
await p.getByRole('button', { name: /明信片背面|明信片正面/ }).click().catch(() => {});
await p.waitForTimeout(900);
await p.getByRole('button', { name: /放回明信片/ }).click();
await p.waitForTimeout(1400);
await log('back to detail');

// 6. rapid flip spam
await p.getByRole('button', { name: /抽出纪念明信片/ }).click();
await p.waitForTimeout(1500);
for (let i = 0; i < 5; i++) { await p.locator('.pc-object').click({ force: true }).catch(() => {}); await p.waitForTimeout(120); }
await p.waitForTimeout(1400);
await log('after flip spam');
await p.screenshot({ path: 'docs/v4/shots/stress-flip.png' });

// 7. complete + reset
await p.getByRole('button', { name: /收下这张明信片/ }).click();
await p.waitForTimeout(2400);
await log('complete');
await p.getByRole('button', { name: /完成体验/ }).click();
await p.waitForTimeout(1600);
await log('reset');
await p.screenshot({ path: 'docs/v4/shots/stress-reset.png' });
console.log('errors', JSON.stringify(errs));
await b.close();
