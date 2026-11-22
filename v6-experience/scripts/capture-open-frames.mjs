import { chromium } from '@playwright/test';
import fs from 'node:fs';
const out = 'docs/v6.2-final/open-frames';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://127.0.0.1:4199/');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
const opener = page.getByRole('button', { name: /轻触拆开校园来信/ });
await opener.click();
for (let i = 0; i < 24; i++) {
  await page.screenshot({ path: `${out}/frame-${String(i).padStart(2,'0')}.png` });
  await page.waitForTimeout(80);
}
await browser.close();
