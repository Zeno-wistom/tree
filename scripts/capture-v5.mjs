import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.V5_BASE_URL || 'http://127.0.0.1:5175';
const output = 'docs/v5';
const mode = process.argv[2] || 'all';
await Promise.all(['shots', 'frames', 'video', 'comparison'].map(folder => mkdir(`${output}/${folder}`, { recursive: true })));
const browser = await chromium.launch({ channel: 'msedge' });
const errors = [];
const listen = page => {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('ERR_FAILED')) errors.push(message.text()); });
};
const ready = async (page, phase) => page.waitForFunction(value => {
  const root = document.querySelector('#root .v5');
  return root?.dataset.phase === value && root.dataset.busy === 'false';
}, phase, { timeout: 25000 });
const shot = (page, filename) => page.screenshot({ path: `${output}/${filename}.png` });
const open = async page => {
  await page.getByRole('button', { name: '打开校园来信', exact: true }).click();
  await ready(page, 'DISCOVER');
};
const saveVideo = async (context, page, filename) => {
  const video = page.video();
  await context.close();
  await video.saveAs(`${output}/${filename}.webm`);
  await video.delete();
};

async function screenshots() {
  for (const width of [1920, 1366]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1920 ? 1080 : 768 } });
    const page = await context.newPage();
    listen(page);
    await page.goto(base, { waitUntil: 'networkidle' });
    await ready(page, 'IDLE');
    await page.evaluate(() => document.fonts.ready);
    await shot(page, `shots/${width}-01-idle`);
    await open(page);
    await page.mouse.move(20, 20);
    await shot(page, `shots/${width}-02-discover`);
    await page.locator('.v5-event-hit').nth(1).hover();
    await page.waitForTimeout(350);
    await shot(page, `shots/${width}-03-focus`);
    await page.locator('.v5-event-hit').nth(1).click();
    await ready(page, 'DETAIL');
    await shot(page, `shots/${width}-04-detail`);
    await page.getByRole('button', { name: '取出纪念明信片' }).click();
    await ready(page, 'POSTCARD');
    await shot(page, `shots/${width}-05-postcard`);
    await page.getByRole('button', { name: /明信片正面，点击翻面/ }).click();
    await ready(page, 'POSTCARD');
    await shot(page, `shots/${width}-06-back`);
    await page.getByRole('button', { name: /收下这张明信片/ }).click();
    await ready(page, 'COMPLETE');
    await shot(page, `shots/${width}-07-complete`);
    await page.getByRole('button', { name: /完成体验，返回首页/ }).click();
    await ready(page, 'IDLE');
    await shot(page, `shots/${width}-08-reset`);
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  await page.route(/\/src\/main\.tsx(?:\?|$)/, route => route.abort());
  await page.goto(base, { waitUntil: 'networkidle' });
  await shot(page, 'shots/static-first-frame');
  await context.close();
}

async function frames() {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  listen(page);
  await page.clock.install();
  await page.goto(base, { waitUntil: 'networkidle' });
  await ready(page, 'IDLE');
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100);
  await page.getByRole('button', { name: '打开校园来信', exact: true }).click({ force: true });
  const samples = [];
  for (const [index, percent] of [0, 25, 50, 75, 100].entries()) {
    if (index) await page.clock.runFor(925);
    if (percent === 100) await page.clock.runFor(80);
    await shot(page, `frames/open-${String(percent).padStart(3, '0')}`);
    samples.push({ percent, envelope: await page.locator('.v5-envelope').boundingBox(), cards: await page.locator('.v5-event').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.event, transform: getComputedStyle(node).transform }))), phase: await page.locator('#root .v5').getAttribute('data-phase') });
  }
  await page.clock.runFor(800);
  await shot(page, 'frames/open-stable');
  await page.locator('.v5-event-hit').nth(1).click({ force: true });
  for (let index = 0; index <= 4; index++) {
    if (index) await page.clock.runFor(323);
    await shot(page, `frames/detail-${String(index * 25).padStart(3, '0')}`);
  }
  await page.clock.runFor(500);
  await page.getByRole('button', { name: '取出纪念明信片' }).click({ force: true });
  for (let index = 0; index <= 4; index++) {
    if (index) await page.clock.runFor(315);
    await shot(page, `frames/postcard-${String(index * 25).padStart(3, '0')}`);
  }
  await page.clock.runFor(300);
  await page.getByRole('button', { name: /明信片正面，点击翻面/ }).click({ force: true });
  for (let index = 0; index <= 4; index++) {
    if (index) await page.clock.runFor(180);
    await shot(page, `frames/flip-${String(index * 25).padStart(3, '0')}`);
  }
  await page.clock.runFor(300);
  await page.getByRole('button', { name: /收下这张明信片/ }).click({ force: true });
  for (let index = 0; index <= 4; index++) {
    if (index) await page.clock.runFor(480);
    await shot(page, `frames/collect-${String(index * 25).padStart(3, '0')}`);
  }
  await writeFile(`${output}/frames/geometry.json`, JSON.stringify(samples, null, 2));
  await context.close();
}

async function recordings() {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: `${output}/video`, size: { width: 1920, height: 1080 } } });
  const page = await context.newPage();
  listen(page);
  const start = Date.now();
  const marks = [];
  const mark = label => marks.push({ label, seconds: (Date.now() - start) / 1000 });
  await page.goto(base, { waitUntil: 'networkidle' });
  await ready(page, 'IDLE');
  mark('首次进入与连续三次风效');
  await page.waitForTimeout(15000);
  mark('揭封、开盖、同一信封沉底、逐张抽信');
  await open(page);
  await page.waitForTimeout(700);
  for (const index of [0, 1, 2, 1]) {
    await page.locator('.v5-event-hit').nth(index).hover();
    await page.waitForTimeout(450);
  }
  await page.getByRole('button', { name: '澳门大学', exact: true }).click();
  await ready(page, 'DISCOVER');
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: '全部来信', exact: true }).click();
  await ready(page, 'DISCOVER');
  mark('活动详情与逆向返回');
  await page.locator('.v5-event-hit').nth(1).click();
  await ready(page, 'DETAIL');
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: /放回活动来信/ }).click();
  await ready(page, 'DISCOVER');
  await page.waitForTimeout(500);
  await page.locator('.v5-event-hit').nth(1).click();
  await ready(page, 'DETAIL');
  mark('明信片抽出与正反翻转');
  await page.getByRole('button', { name: '取出纪念明信片' }).click();
  await ready(page, 'POSTCARD');
  await page.waitForTimeout(1400);
  await page.getByRole('button', { name: /明信片正面，点击翻面/ }).click();
  await ready(page, 'POSTCARD');
  await page.waitForTimeout(1800);
  mark('确认、入套、盖章');
  await page.getByRole('button', { name: /收下这张明信片/ }).click();
  await ready(page, 'COMPLETE');
  await page.waitForTimeout(2300);
  mark('连续复位回到同一首页信封');
  await page.getByRole('button', { name: /完成体验，返回首页/ }).click();
  await ready(page, 'IDLE');
  await page.waitForTimeout(1800);
  await writeFile(`${output}/video/full-recording-timeline.json`, JSON.stringify({ uncut: true, automatedRealBrowser: true, viewport: '1920x1080', durationSeconds: (Date.now() - start) / 1000, marks }, null, 2));
  await saveVideo(context, page, 'v5-full-experience');
  for (const kind of ['first-entry-wind', 'open-continuous']) {
    const shortContext = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: `${output}/video`, size: { width: 1920, height: 1080 } } });
    const shortPage = await shortContext.newPage();
    listen(shortPage);
    await shortPage.goto(base, { waitUntil: 'networkidle' });
    await ready(shortPage, 'IDLE');
    if (kind === 'first-entry-wind') await shortPage.waitForTimeout(15000);
    else { await shortPage.waitForTimeout(650); await open(shortPage); await shortPage.waitForTimeout(1800); }
    await saveVideo(shortContext, shortPage, `v5-${kind}`);
  }
}

async function performance() {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  listen(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await page.goto(base, { waitUntil: 'networkidle' });
  await ready(page, 'IDLE');
  const before = await cdp.send('Performance.getMetrics');
  const sample = page.evaluate(() => new Promise(resolve => {
    const frames = [];
    let previous = performance.now();
    const start = previous;
    const observe = now => {
      const envelope = document.querySelector('#root .v5-envelope');
      frames.push({ delta: now - previous, y: envelope.getBoundingClientRect().y, phase: document.querySelector('#root .v5').dataset.phase });
      previous = now;
      if (now - start < 5500) requestAnimationFrame(observe); else resolve(frames);
    };
    requestAnimationFrame(observe);
  }));
  await open(page);
  const frames = await sample;
  const after = await cdp.send('Performance.getMetrics');
  const ordered = frames.map(frame => frame.delta).slice(2).sort((first, second) => first - second);
  const metrics = value => Object.fromEntries(value.metrics.map(item => [item.name, item.value]));
  const first = metrics(before);
  const last = metrics(after);
  const result = { browser: await browser.version(), viewport: '1920x1080', recordingEnabled: false, sampleCount: ordered.length, medianFrameMs: ordered[Math.floor(ordered.length / 2)], p95FrameMs: ordered[Math.floor(ordered.length * 0.95)], maxFrameMs: Math.max(...ordered), framesOver34ms: ordered.filter(value => value > 34).length, maxEnvelopeStepPx: Math.max(...frames.slice(1).map((frame, index) => Math.abs(frame.y - frames[index].y))), layoutCount: last.LayoutCount - first.LayoutCount, recalcStyleCount: last.RecalcStyleCount - first.RecalcStyleCount, scriptSeconds: last.ScriptDuration - first.ScriptDuration, taskSeconds: last.TaskDuration - first.TaskDuration, limitation: 'Local Edge requestAnimationFrame sampling; does not establish physical touchscreen GPU performance or perceived usability.' };
  await writeFile(`${output}/performance.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  await context.close();
}

async function baseline() {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const wait = value => page.waitForFunction(phase => document.querySelector('#root .v4')?.dataset.phase === phase, value);
  await page.goto(`${base}/?v4`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await shot(page, 'comparison/v4-idle');
  await page.getByRole('button', { name: '打开校园来信', exact: true }).click();
  await wait('DISCOVER');
  await page.waitForTimeout(700);
  await shot(page, 'comparison/v4-discover');
  await page.locator('.card-hit').nth(1).hover();
  await page.waitForTimeout(450);
  await page.locator('.card-hit').nth(1).click();
  await wait('DETAIL');
  await page.waitForTimeout(600);
  await shot(page, 'comparison/v4-detail');
  await page.getByRole('button', { name: /抽出纪念明信片/ }).click();
  await wait('POSTCARD');
  await page.waitForTimeout(500);
  await shot(page, 'comparison/v4-postcard');
  await page.getByRole('button', { name: /收下这张明信片/ }).click();
  await wait('COMPLETE');
  await page.waitForTimeout(700);
  await shot(page, 'comparison/v4-complete');
  await context.close();
}

try {
  if (mode === 'all' || mode === 'shots') await screenshots();
  if (mode === 'all' || mode === 'frames') await frames();
  if (mode === 'all' || mode === 'record') await recordings();
  if (mode === 'all' || mode === 'performance') await performance();
  if (mode === 'all' || mode === 'baseline') await baseline();
  await writeFile(`${output}/capture-errors-${mode}.json`, JSON.stringify(errors, null, 2));
  console.log(JSON.stringify({ mode, errors }));
} finally { await browser.close(); }
