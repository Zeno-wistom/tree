import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
for (const [name, w, h] of [['1920', 1920, 1080], ['1366', 1366, 768]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:4199/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `docs/v6.2-final/${name}-v63-home.png` });
  await page.getByRole('button', { name: /轻触拆开校园来信/ }).click();
  await page.waitForFunction(() => document.querySelector('.v6a')?.dataset.phase === 'DISCOVER');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `docs/v6.2-final/${name}-v63-open.png` });
  console.log(name, await page.evaluate(() => ({
    env: document.querySelector('.v6a-envelope').getBoundingClientRect().toJSON(),
    cards: [...document.querySelectorAll('.v6a-event')].map(e => e.getBoundingClientRect().toJSON()),
    pocketTop: document.querySelector('.v6a-pocket').getBoundingClientRect().toJSON(),
  })));
  await page.close();
}
await browser.close();
