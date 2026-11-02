import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const b = await chromium.launch({ channel: 'msedge' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 810 } })).newPage();
await p.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1400);
const html = await p.evaluate(() => {
  const root = document.querySelector('.v4').cloneNode(true);
  root.querySelectorAll('.fan, .letter-stage, .postcard-stage, .complete-stage, .discover-head, .filters, .filter-count, .discover-tip, .tray-label, .wind, dialog, .skip-btn').forEach(e => e.remove());
  const btn = root.querySelector('.env-open');
  if (btn) { const d = document.createElement('div'); d.className = 'env-open'; d.setAttribute('aria-hidden', 'true'); btn.replaceWith(d); }
  root.querySelectorAll('[style]').forEach(el => {
    const s = el.getAttribute('style');
    if (s.includes('translate: none')) el.removeAttribute('style');
  });
  // quiet the interactive bits
  root.querySelectorAll('button').forEach(el => { el.setAttribute('tabindex', '-1'); });
  return root.outerHTML;
});
await fs.writeFile('docs/v4/shell.html', html);
console.log('len', html.length, '| fan?', html.includes('fan-card'), '| button?', html.includes('<button'));
await b.close();
