import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1366,height:768}});
await page.addInitScript(() => {
  const original = console.warn;
  window.__warnings = [];
  console.warn = (...args) => { window.__warnings.push({args, stack: new Error().stack}); original(...args); };
});
await page.goto('http://127.0.0.1:4199/'); await page.evaluate(() => document.fonts.ready);
for (const [x,y] of [[0,0],[1365,0],[0,767],[1365,767]]) { await page.mouse.move(x,y); await page.waitForTimeout(450); await page.locator('.v6-home-bough .v6-main-bough').evaluate(p=>p.getBoundingClientRect()); }
const scene=page.locator('.v6a');
await page.getByRole('button',{name:/轻触拆开校园来信/}).click();
for(let i=0;i<200;i++){if(await scene.getAttribute('data-phase')==='DISCOVER')break; await page.waitForTimeout(20);}
await page.screenshot({path:'docs/v6.2-final/warn-exact.png'});
await page.getByRole('navigation',{name:'按学校筛选'}).getByRole('button',{name:'广场纪念'}).click();
await page.waitForTimeout(900);
console.log('warnings after filter',JSON.stringify(await page.evaluate(() => window.__warnings),null,2));
await page.locator('[data-event="garden-memory"] .v6a-event-hit').click(); await page.waitForTimeout(700);
await page.getByText('关于这张广场纪念卡').click(); await page.waitForTimeout(200);
await page.getByRole('button',{name:'明信片背面，翻到正面'}).click(); await page.waitForTimeout(700);
await page.getByRole('button',{name:/完成数字收藏/}).click(); await page.waitForTimeout(1200);
console.log('warnings after collect',JSON.stringify(await page.evaluate(() => window.__warnings),null,2));
await browser.close();
