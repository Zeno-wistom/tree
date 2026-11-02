import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const errs = [];
p.on('pageerror', e => errs.push('ERR ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
const phase = () => p.evaluate(() => document.querySelector('.v4')?.getAttribute('data-phase'));
const step = async (name, fn) => { try { await fn(); console.log('ok', name, await phase()); } catch (e) { console.log('FAIL', name, await phase(), e.message.split('\n')[0]); throw e; } };
await p.goto('http://localhost:4174/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
await step('open', async () => {
  await p.getByRole('button', { name: '打开校园来信' }).click();
  await p.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'DISCOVER', null, { timeout: 12000 });
  await p.waitForTimeout(900);
});
await p.screenshot({ path: 'docs/v4/shots/02-discover.png' });
await step('hover', async () => { await p.locator('.fan-card').nth(2).hover(); await p.waitForTimeout(700); });
await p.screenshot({ path: 'docs/v4/shots/03-focus.png' });
await step('detail', async () => {
  await p.locator('.fan-card').nth(2).locator('.card-hit').click();
  await p.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'DETAIL', null, { timeout: 12000 });
  await p.waitForTimeout(900);
});
await p.screenshot({ path: 'docs/v4/shots/04-detail.png' });
await step('postcard', async () => {
  await p.getByRole('button', { name: /抽出纪念明信片/ }).click();
  await p.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'POSTCARD', null, { timeout: 12000 });
  await p.waitForTimeout(900);
});
await p.screenshot({ path: 'docs/v4/shots/05-postcard.png' });
await step('flip', async () => { await p.locator('.pc-object').click(); await p.waitForTimeout(1200); });
await p.screenshot({ path: 'docs/v4/shots/06-postcard-back.png' });
await step('complete', async () => {
  await p.getByRole('button', { name: /收下这张明信片/ }).click();
  await p.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'COMPLETE', null, { timeout: 12000 });
  await p.waitForTimeout(1900);
});
await p.screenshot({ path: 'docs/v4/shots/07-complete.png' });
console.log('errors', JSON.stringify(errs));
await b.close();
