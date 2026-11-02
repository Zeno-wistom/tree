import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
const c = await b.newContext({ viewport: { width: 1366, height: 768 }, hasTouch: true, isMobile: false });
const p = await c.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
const phase = () => p.evaluate(() => document.querySelector('.v4')?.getAttribute('data-phase'));

await p.goto('http://localhost:4174/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
await p.tap('.env-open');
await p.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'DISCOVER', null, { timeout: 12000 });
await p.waitForTimeout(900);
console.log('after tap open', await phase());
await p.screenshot({ path: 'docs/v4/shots/touch-discover.png' });

// first tap focuses, second opens
const card = p.locator('.fan-card').nth(2);
await card.locator('.card-hit').tap({ force: true });
await p.waitForTimeout(700);
const picked = await p.evaluate(() => document.querySelector('.fan-card.is-focus')?.getAttribute('data-id'));
console.log('after 1st tap: focused =', picked, 'phase =', await phase());
await p.screenshot({ path: 'docs/v4/shots/touch-focus.png' });
await card.locator('.card-hit').tap({ force: true });
await p.waitForTimeout(1900);
console.log('after 2nd tap: phase =', await phase());
await p.screenshot({ path: 'docs/v4/shots/touch-detail.png' });

// timeout dialog
await p.evaluate(() => { window.__v4FastIdle = true; });
console.log('errors', JSON.stringify(errs));
await b.close();
