import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true});
for (const [name,width,height] of [['1920',1920,1080],['1366',1366,768],['1600',1600,900],['1440x900',1440,900]]) {
 const page = await browser.newPage({viewport:{width,height}});
 await page.goto('http://127.0.0.1:4199/'); await page.evaluate(()=>document.fonts.ready);
 for (const [edge,x,y] of [['tl',0,0],['tr',width-1,0],['bl',0,height-1],['br',width-1,height-1]]) { await page.mouse.move(x,y); await page.waitForTimeout(500); await page.screenshot({path:`docs/v6.2-final/${name}-home-${edge}.png`}); }
 await page.getByRole('button',{name:/轻触拆开校园来信/}).click(); await page.waitForTimeout(1600);
 await page.screenshot({path:`docs/v6.2-final/${name}-open.png`});
 await page.close();
}
await browser.close();
