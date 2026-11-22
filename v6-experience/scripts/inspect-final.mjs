import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()); });
await page.goto('http://127.0.0.1:4199/');
await page.evaluate(() => document.fonts.ready);
for (const [name, x, y] of [['top-left', 0, 0], ['bottom-right', 1439, 899], ['center', 720, 450]]) {
  await page.mouse.move(x, y);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `docs/v6.2-final/after-pointer-${name}.png` });
}
await page.getByRole('button', { name: /轻触拆开校园来信/ }).click();
await page.waitForTimeout(1700);
await page.screenshot({ path: 'docs/v6.2-final/after-open.png' });
console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
