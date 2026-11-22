import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
for (const [w,h] of [[1366,768],[1920,1080],[1440,900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4199/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const pre = await page.evaluate(() => ({
    scale: getComputedStyle(document.querySelector('.v6a-paper-space')).getPropertyValue('--object-scale'),
    env: document.querySelector('.v6a-envelope').getBoundingClientRect().toJSON(),
  }));
  await page.getByRole('button', { name: /轻触拆开校园来信/ }).click();
  await page.waitForTimeout(500);
  const post = await page.evaluate(() => {
    const q = (s) => document.querySelector(s).getBoundingClientRect().toJSON();
    return {
      scale: getComputedStyle(document.querySelector('.v6a-paper-space')).getPropertyValue('--object-scale'),
      env: q('.v6a-envelope'), pocket: q('.v6a-pocket'), fan: q('.v6a-fan'),
      cards: [...document.querySelectorAll('.v6a-event')].map(e => e.getBoundingClientRect().toJSON()),
      title: q('.v6a-discover-head'), filters: q('.v6a-filters'), label: q('.v6a-dock-label'),
      phase: document.querySelector('.v6a').dataset.phase,
    };
  });
  console.log(w, h, JSON.stringify({pre,post}, null, 1));
  await page.close();
}
await browser.close();
