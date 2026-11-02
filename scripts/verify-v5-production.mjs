import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5176';
const browser = await chromium.launch({ channel: 'msedge' });
const results = [];
const errors = [];
const ready = (page, phase) => page.waitForFunction(value => {
  const root = document.querySelector('#root .v5');
  return root?.dataset.phase === value && root.dataset.busy === 'false';
}, phase);

try {
  const staticPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await staticPage.route(/\/assets\/index-[^/]+\.js$/, route => route.abort());
  await staticPage.goto(base, { waitUntil: 'networkidle' });
  await expect(staticPage.locator('#first-frame .v5-envelope')).toBeVisible();
  results.push({ check: 'Production static envelope with main JavaScript unavailable', passed: true });
  await staticPage.close();

  for (const [width, height] of [[1920, 1080], [1366, 768]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    let release;
    const blocked = new Promise(resolve => { release = resolve; });
    await page.route(/\/assets\/index-[^/]+\.js$/, async route => { await blocked; await route.continue(); });
    const navigation = page.goto(base, { waitUntil: 'networkidle' });
    await expect(page.locator('#first-frame .v5-open')).toBeVisible();
    await page.locator('#first-frame .v5-open').click();
    release();
    await navigation;
    await ready(page, 'DISCOVER');
    await page.locator('.v5-event-hit').nth(1).click();
    await ready(page, 'DETAIL');
    await page.getByRole('button', { name: '取出纪念明信片' }).click();
    await ready(page, 'POSTCARD');
    await page.getByRole('button', { name: /明信片正面，点击翻面/ }).click();
    await ready(page, 'POSTCARD');
    await page.getByRole('button', { name: /收下这张明信片/ }).click();
    await ready(page, 'COMPLETE');
    await page.getByRole('button', { name: /完成体验，返回首页/ }).click();
    await ready(page, 'IDLE');
    results.push({ check: 'Production early first-frame click, full journey and reset', viewport: `${width}x${height}`, passed: true });
    await page.close();
  }
  if (errors.length) throw new Error(JSON.stringify(errors));
  const result = { base, browser: await browser.version(), results, errors };
  await writeFile('docs/v5/production-smoke.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
