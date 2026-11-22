import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const BASE = 'http://127.0.0.1:5174/?v3';
const OUT = 'docs/audit-v3';
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const logs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

// --- 1. first paint timeline (cold, no cache) ---
const t0 = Date.now();
await page.goto(BASE, { waitUntil: 'commit' });
const marks = [];
for (const t of [80, 200, 400, 700, 1100, 1600, 2400]) {
  const wait = t - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  const shot = `${OUT}/first-${String(t).padStart(4, '0')}ms.png`;
  await page.screenshot({ path: shot });
  const snap = await page.evaluate(() => {
    const root = document.querySelector('#root');
    const cs = root ? getComputedStyle(root.firstElementChild ?? root) : null;
    return {
      html: document.documentElement.getBoundingClientRect().height,
      rootChildren: root ? root.childElementCount : -1,
      rootHTML: root ? root.innerHTML.slice(0, 160) : '',
      stage: !!document.querySelector('.v3-stage'),
      bg: document.body ? getComputedStyle(document.body).backgroundColor : '',
    };
  });
  marks.push({ t, ...snap, firstChildStyle: undefined });
}
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/first-settled.png` });

// --- 2. layout shift / fonts ---
const perf = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const paints = performance.getEntriesByType('paint').map(p => ({ name: p.name, start: Math.round(p.startTime) }));
  return {
    paints,
    domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
    load: Math.round(nav.loadEventEnd),
    fonts: document.fonts.status,
    v3Present: !!document.querySelector('.v3'),
    stageRect: (() => { const r = document.querySelector('.v3-stage')?.getBoundingClientRect(); return r ? { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) } : null; })(),
  };
});

// --- 3. idle wind: sample frames over 16s, diff pixels ---
await page.mouse.move(5, 5);
const idleShots = [];
for (let i = 0; i < 16; i++) {
  await page.waitForTimeout(1000);
  const p = `${OUT}/idle-${String(i).padStart(2, '0')}s.png`;
  await page.screenshot({ path: p });
  idleShots.push(p);
}
const sealBox = await page.evaluate(() => {
  const q = s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { w: Math.round(r.width), h: Math.round(r.height), opacity: cs.opacity, transform: cs.transform, visibility: cs.visibility, z: cs.zIndex }; };
  return { wind: q('.v3-wind'), wind2: q('.v3-wind.second'), leaf: q('.v3-leaf'), tail: q('.v3-seal-tail'), seal: q('.v3-seal'), env: q('.v3-envelope') };
});

// --- 4. opening mid frames ---
await page.getByRole('button', { name: '打开校园来信' }).click();
for (const t of [120, 320, 560, 900, 1300, 1800]) {
  await page.waitForTimeout(t === 120 ? 120 : 0);
  await page.screenshot({ path: `${OUT}/opening-${String(t).padStart(4, '0')}ms.png` });
  await page.waitForTimeout(200);
}
await page.waitForFunction(() => document.querySelector('.v3')?.getAttribute('data-busy') === 'false');
await page.screenshot({ path: `${OUT}/discover.png` });

// --- 5. hover focus + detail + postcard + complete ---
await page.locator('.v3-event').first().hover();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/discover-focus.png` });
await page.locator('.v3-event').first().click();
await page.waitForFunction(() => document.querySelector('.v3')?.getAttribute('data-state') === 'DETAIL' && document.querySelector('.v3')?.getAttribute('data-busy') === 'false');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/detail.png` });
await page.getByRole('button', { name: /抽出纪念明信片/ }).click();
await page.waitForFunction(() => document.querySelector('.v3')?.getAttribute('data-state') === 'POSTCARD' && document.querySelector('.v3')?.getAttribute('data-busy') === 'false');
await page.screenshot({ path: `${OUT}/postcard.png` });
await page.getByRole('button', { name: /点击翻面/ }).click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/postcard-back.png` });
await page.getByRole('button', { name: /确认收藏/ }).click();
await page.waitForFunction(() => document.querySelector('.v3')?.getAttribute('data-state') === 'COMPLETE' && document.querySelector('.v3')?.getAttribute('data-busy') === 'false');
await page.waitForTimeout(1400);
await page.screenshot({ path: `${OUT}/complete.png` });

await fs.writeFile(`${OUT}/audit.json`, JSON.stringify({ marks, perf, sealBox, logs, idleShots }, null, 2));
await browser.close();
console.log('done');
