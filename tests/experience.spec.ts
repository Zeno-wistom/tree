import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const shots = 'docs/screenshots';
mkdirSync(shots, { recursive: true });
async function snapshot(page: Page, name: string, size: string) { await page.screenshot({ path: `${shots}/${size}-${name}.png`, animations: 'disabled' }); }
async function start(page: Page) { await page.goto('/'); await page.getByRole('button', { name: '开始探索' }).click(); }
async function choose(page: Page, name = '冬日校园漫游') { await page.getByRole('button').filter({ has: page.getByRole('heading', { name, exact: true }) }).click(); }
async function noOuterScroll(page: Page) { expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }))).toEqual({ x: false, y: false }); }

test('五页完整流程、匹配、翻面、清空与实际截图', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('小美好');
  await noOuterScroll(page); await snapshot(page, 'P0-home', info.project.name);
  await page.getByRole('button', { name: '开始探索' }).click();
  await expect(page.getByRole('status')).toContainText('06');
  await snapshot(page, 'P1-discover', info.project.name); await noOuterScroll(page);
  await choose(page); await expect(page.getByRole('heading', { level: 1 })).toHaveText('冬日校园漫游');
  await snapshot(page, 'P2-detail', info.project.name); await noOuterScroll(page);
  await page.getByRole('button', { name: '查看纪念明信片' }).click();
  await snapshot(page, 'P3-front', info.project.name); await noOuterScroll(page);
  const hint = await page.locator('.flip-hint').boundingBox(); const bar = await page.locator('.confirm-bar').boundingBox();
  expect(hint!.y + hint!.height).toBeLessThanOrEqual(bar!.y);
  const card = page.getByRole('button', { name: '明信片正面，点击翻面' });
  await card.click(); await expect(page.getByRole('button', { name: '明信片背面，点击翻面' })).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(750); await snapshot(page, 'P3-back', info.project.name);
  await expect(page.locator('.flip-face.back')).toContainText('冬日校园漫游');
  await page.getByRole('button', { name: '就选这张，确认选择' }).click();
  await expect(page.locator('.chosen')).toContainText('冬日校园漫游');
  await expect(page.getByText('本次仅完成数字选择')).toBeVisible();
  await page.waitForTimeout(850); await snapshot(page, 'P4-complete', info.project.name); await noOuterScroll(page);
  await page.getByRole('button', { name: '完成体验，返回首页' }).click();
  await page.getByRole('button', { name: '开始探索' }).click(); await expect(page.getByRole('button', { name: '全部活动', exact: false })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('三校筛选、返回保留筛选和滚动、修改活动匹配', async ({ page }) => {
  await start(page);
  for (const school of ['澳门大学', '澳门理工大学', '澳门旅游大学']) {
    await page.getByRole('button', { name: school, exact: false }).first().click();
    await expect(page.getByRole('status')).toContainText('02');
    for (const meta of await page.locator('.event-meta').allTextContents()) expect(meta).toContain(school);
  }
  await choose(page, '一口暖暖的澳门'); await page.getByRole('button', { name: '查看纪念明信片' }).click();
  await expect(page.locator('.postcard-caption strong')).toHaveText('一口暖暖的澳门');
  await page.getByRole('button', { name: '返回活动详情' }).click(); await page.getByRole('button', { name: '返回活动列表' }).click();
  await expect(page.getByRole('button', { name: '澳门旅游大学', exact: false }).first()).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '全部活动', exact: false }).click();
  const list = page.locator('.event-scroll'); await list.evaluate(el => { el.scrollTop = 100; });
  await page.getByRole('button').filter({ has: page.getByRole('heading', { name: '树下的冬日旋律', exact: true }) }).scrollIntoViewIfNeeded();
  const before = await list.evaluate(el => el.scrollTop);
  await choose(page, '树下的冬日旋律'); await page.getByRole('button', { name: '返回活动列表' }).click();
  expect(await list.evaluate(el => el.scrollTop)).toBe(before);
  await choose(page, '把冬天印在纸上'); await page.getByRole('button', { name: '查看纪念明信片' }).click(); await page.getByRole('button', { name: '就选这张，确认选择' }).click();
  await expect(page.locator('.chosen')).toContainText('把冬天印在纸上');
});

test('无操作90秒提示、继续、15秒重置、刷新清空', async ({ page }, info) => {
  await page.clock.install(); await start(page); await choose(page);
  await page.clock.fastForward(90_500);
  await expect(page.getByRole('dialog')).toBeVisible();
  await snapshot(page, 'timeout', info.project.name);
  await expect(page.getByRole('button', { name: '继续探索' })).toBeFocused();
  await page.getByRole('button', { name: '继续探索' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('冬日校园漫游');
  await page.clock.fastForward(90_500); await expect(page.getByRole('dialog')).toBeVisible();
  await page.clock.fastForward(15_500); await expect(page.getByRole('heading', { level: 1 })).toContainText('小美好');
  await page.getByRole('button', { name: '开始探索' }).click(); await choose(page); await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('小美好');
});

test('空列表与无匹配明信片安全状态', async ({ page }, info) => {
  await page.route('**/src/data.ts', async route => { const response = await route.fetch(); await route.fulfill({ response, body: (await response.text()) + '\nevents.splice(0);\n' }); });
  await start(page); await expect(page.getByRole('heading', { name: '新的故事，还在路上' })).toBeVisible();
  await page.getByRole('button', { name: '查看全部活动' }).click(); await expect(page.getByRole('status')).toContainText('00');
  await snapshot(page, 'empty', info.project.name);
  await page.unroute('**/src/data.ts');
  await page.route('**/src/data.ts', async route => { const response = await route.fetch(); await route.fulfill({ response, body: (await response.text()) + '\npostcards.splice(0);\n' }); });
  await start(page); await choose(page); await page.getByRole('button', { name: '查看纪念明信片' }).click();
  await expect(page.getByRole('heading', { name: '这张明信片还在准备中' })).toBeVisible(); await expect(page.getByRole('button', { name: '就选这张，确认选择' })).toHaveCount(0);
  await snapshot(page, 'missing-postcard', info.project.name); await page.getByRole('button', { name: '返回活动列表' }).click();
  await expect(page.getByRole('status')).toContainText('06');
});

test('键盘翻面、焦点、弹窗约束与减少动态效果', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.clock.install(); await start(page); await choose(page);
  await page.getByRole('button', { name: '查看纪念明信片' }).click();
  const card = page.getByRole('button', { name: '明信片正面，点击翻面' }); await card.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '明信片背面，点击翻面' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('.flip-inner').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  await page.clock.fastForward(90_500); await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button', { name: '结束体验，返回首页' })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: '继续探索' })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '明信片背面，点击翻面' })).toBeFocused();
});

test('窄屏完整体验无横向溢出', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await start(page); await choose(page); await page.getByRole('button', { name: '查看纪念明信片' }).click();
  await page.getByRole('button', { name: '明信片正面，点击翻面' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: '就选这张，确认选择' }).click(); await expect(page.locator('.chosen')).toContainText('冬日校园漫游');
  await snapshot(page, 'mobile-complete', info.project.name);
});

test('全部活动的正反面与确认结果一一对应', async ({ page }) => {
  for (const name of ['冬日校园漫游', '把冬天印在纸上', '一口暖暖的澳门', '树下的冬日旋律', '看见光的形状', '城市故事交换所']) {
    await start(page); await choose(page, name); await page.getByRole('button', { name: '查看纪念明信片' }).click();
    await expect(page.locator('.postcard-caption strong')).toHaveText(name);
    await page.getByRole('button', { name: '明信片正面，点击翻面' }).click();
    await expect(page.locator('.postcard-back')).toContainText(name);
    await page.getByRole('button', { name: '就选这张，确认选择' }).click();
    await expect(page.locator('.chosen h2')).toHaveText(name);
  }
});
