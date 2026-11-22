import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
for (const q of ['?v3', '?v1', '?postoffice']) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 810 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:4174/' + q, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => ({
    shell: !!document.getElementById('first-frame'),
    v3: !!document.querySelector('.v3'),
    v1: !!document.querySelector('.app'),
    po: !!document.querySelector('[class*=postoffice], .po-app, .home-layout'),
    title: document.title,
  }));
  console.log(q, JSON.stringify(info), errs.length ? errs : 'no errors');
  await p.screenshot({ path: `docs/v4/shots/legacy${q.replace('?', '-')}.jpg` });
  await p.close();
}
await b.close();
