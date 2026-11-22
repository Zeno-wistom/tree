import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const OUT = 'docs/v4';
await fs.mkdir(`${OUT}/video`, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: `${OUT}/video`, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
const wait = ms => page.waitForTimeout(ms);
const phase = () => page.getAttribute('.v4', 'data-phase');
const glide = async (x, y, steps = 24) => { await page.mouse.move(x, y, { steps }); };

const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 160, downloadThroughput: 400 * 1024, uploadThroughput: 200 * 1024 });
await page.goto('http://localhost:4174/', { waitUntil: 'commit' });
await wait(900);                                   // first frame while JS streams in
await page.waitForFunction(() => document.querySelector('.v4') !== null, null, { timeout: 20000 });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(1500);
await glide(960, 620);                             // arrive at the envelope
await wait(5200);                                  // idle: a gust lifts the seal (about 8s cycle)
await glide(1200, 700);
await wait(4200);
await page.getByRole('button', { name: '打开校园来信' }).click();
await wait(3400);
console.log('phase', await phase());
await glide(1500, 760, 30);
await wait(1400);
// hover across the fan
for (const [x, y] of [[1470, 780], [1310, 790], [1130, 800], [960, 800]]) { await glide(x, y, 18); await wait(420); }
await wait(900);
await page.locator('.fan-card').nth(2).locator('.card-hit').click();
await page.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'DETAIL', null, { timeout: 12000 });
await wait(2600);
await glide(1300, 900, 20);
await wait(900);
await page.getByRole('button', { name: /抽出纪念明信片/ }).click();
await page.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'POSTCARD', null, { timeout: 12000 });
await wait(2200);
await gliss();
async function gliss() { await glide(960, 700, 22); }
await page.locator('.pc-object').click();
await wait(2400);
await page.locator('.pc-object').click();
await wait(1600);
await page.getByRole('button', { name: /收下这张明信片/ }).click();
await page.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'COMPLETE', null, { timeout: 12000 });
await wait(3600);
await glide(1080, 830, 22);
await wait(800);
await page.getByRole('button', { name: /完成体验/ }).click();
await page.waitForFunction(() => document.querySelector('.v4')?.getAttribute('data-phase') === 'IDLE', null, { timeout: 12000 });
await wait(2600);
await glide(700, 500, 20);
await wait(3200);
console.log('errors', JSON.stringify(errs));
const video = page.video();
await ctx.close();
await video.saveAs(`${OUT}/v4-experience.webm`);
await browser.close();
console.log('saved');
