import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'msedge' });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const ready = phase => page.waitForFunction(value => {
  const root = document.querySelector('#root .v5');
  return root?.dataset.phase === value && root.dataset.busy === 'false';
}, phase);

try {
  await page.goto('http://127.0.0.1:5175', { waitUntil: 'networkidle' });
  await ready('IDLE');
  const moduleURL = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name).find(url => /\/gsap\.js\?/.test(url)));
  if (!moduleURL) throw new Error('Unable to identify the application GSAP module');
  const snapshots = [];
  for (let cycle = 0; cycle < 12; cycle++) {
    await page.getByRole('button', { name: '打开校园来信', exact: true }).click();
    await ready('DISCOVER');
    for (const name of ['澳门大学', '澳门理工大学', '澳门旅游大学', '全部来信']) {
      await page.getByRole('button', { name, exact: true }).click();
      await ready('DISCOVER');
    }
    await page.locator('.v5-event-hit').nth(1).click();
    await ready('DETAIL');
    await page.getByRole('button', { name: '取出纪念明信片' }).click();
    await ready('POSTCARD');
    await page.getByRole('button', { name: /明信片正面，点击翻面/ }).click();
    await ready('POSTCARD');
    await page.getByRole('button', { name: /收下这张明信片/ }).click();
    await ready('COMPLETE');
    await page.getByRole('button', { name: /完成体验，返回首页/ }).click();
    await ready('IDLE');
    await page.waitForTimeout(60);
    snapshots.push(await page.evaluate(async ({ moduleURL, cycle }) => {
      const { gsap } = await import(moduleURL);
      const children = gsap.globalTimeline.getChildren(true, true, true);
      return { cycle: cycle + 1, timelineChildren: children.length, activeAnimations: children.filter(child => child.isActive()).length, domNodes: document.querySelector('#root').querySelectorAll('*').length };
    }, { moduleURL, cycle }));
  }
  const result = { browser: await browser.version(), reducedMotion: true, completedSessions: 12, snapshots, errors, limitation: 'Counts live GSAP timeline children after reset; this is not a heap-allocation or physical-device endurance measurement.' };
  if (errors.length || snapshots.some(sample => sample.activeAnimations > 0) || snapshots.at(-1).timelineChildren > snapshots[0].timelineChildren + 1) throw new Error(JSON.stringify(result));
  await writeFile('docs/v5/runtime-cycles.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
