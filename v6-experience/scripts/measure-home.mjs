import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
for (const [w,h] of [[1366,768],[1920,1080]]) {
  const page = await browser.newPage({ viewport:{width:w,height:h} });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:4199/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  const data = await page.evaluate(() => {
    const q = s => document.querySelector(s)?.getBoundingClientRect().toJSON();
    const leaf = document.querySelector('.v6-home-leaf');
    const label = document.querySelector('.v6-home-leaf .v6-home-object-label');
    return {
      envelope: q('.v6a-envelope'), flap: q('.v6a-envelope-flap'), open: q('.v6a-open'),
      leafBtn: leaf?.getBoundingClientRect().toJSON(), leafArt: q('.v6-home-leaf-art'), leafLabel: label?.getBoundingClientRect().toJSON(),
      paper: q('.v6a-paper-space'), scale: getComputedStyle(document.querySelector('.v6a-paper-space')).getPropertyValue('--object-scale'),
      envTransform: getComputedStyle(document.querySelector('.v6a-envelope')).transform,
      leafZ: getComputedStyle(document.querySelector('.v6a-paper-space')).zIndex,
      homeZ: getComputedStyle(document.querySelector('.v6-home')).zIndex,
    };
  });
  console.log(w,h,JSON.stringify(data,null,1));
  await page.close();
}
await browser.close();
