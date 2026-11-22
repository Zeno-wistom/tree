import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function ready(page: Page, phase: string) {
  await expect(page.locator('#root .v5')).toHaveAttribute('data-phase', phase, { timeout: 22000 });
  await expect(page.locator('#root .v5')).toHaveAttribute('data-busy', 'false');
}
async function open(page: Page) {
  await page.goto('/');
  await ready(page, 'IDLE');
  await page.getByRole('button', { name: '打开校园来信', exact: true }).click();
  await ready(page, 'DISCOVER');
}
async function choose(page: Page, index = 0) {
  await page.locator('.v5-event-hit').nth(index).click();
  await ready(page, 'DETAIL');
}

test('V5 JavaScript 未就绪时已经呈现完整新首帧', async ({ page }) => {
  await page.route(/\/src\/main\.tsx(?:\?|$)/, route => route.abort());
  await page.goto('/');
  await expect(page.locator('#first-frame .v5-cover h1')).toHaveText('校园来信');
  await expect(page.locator('#first-frame .v5-seal-head img')).toBeVisible();
  await expect(page.locator('#first-frame .v4')).toHaveCount(0);
});

test('V5 首帧、持续阵风、同一信封连续下沉', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await ready(page, 'IDLE');
  await expect(page.locator('#first-frame')).toHaveCount(0);
  const before = await page.locator('.v5-envelope').boundingBox();
  const envelope = await page.locator('.v5-envelope').elementHandle();
  await expect.poll(async () => Number(await page.locator('.v5').getAttribute('data-gusts')), { timeout: 12000 }).toBeGreaterThanOrEqual(3);
  await page.getByRole('button', { name: '打开校园来信', exact: true }).click();
  await ready(page, 'DISCOVER');
  const after = await envelope!.boundingBox();
  const viewport = page.viewportSize()!;
  expect(after!.y).toBeGreaterThan(before!.y + viewport.height * 0.3);
  expect(after!.y).toBeLessThan(viewport.height * 0.7);
  expect(after!.y + after!.height).toBeGreaterThan(viewport.height);
  await expect(page.locator('.v5-event')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('V5 三校筛选、分页、详情逆向返回及内容匹配', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '下一组活动' }).click();
  await ready(page, 'DISCOVER');
  await expect(page.locator('.v5-event h2').first()).toHaveText('树下的冬日旋律');
  for (const name of ['澳门大学', '澳门理工大学', '澳门旅游大学']) {
    await page.getByRole('button', { name, exact: true }).click();
    await ready(page, 'DISCOVER');
    await expect(page.locator('.v5-event')).toHaveCount(2);
    await expect(page.locator('.v5-event-school').first()).toHaveText(name);
  }
  await choose(page, 1);
  await expect(page.locator('.v5-sheet-title')).toHaveText('城市故事交换所');
  await page.getByRole('button', { name: /放回活动来信/ }).click();
  await ready(page, 'DISCOVER');
  await expect(page.getByRole('button', { name: '澳门旅游大学', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.v5-event-hit').nth(1)).toBeFocused();
  await choose(page, 1);
  await page.getByRole('button', { name: '取出纪念明信片' }).click();
  await ready(page, 'POSTCARD');
  await expect(page.locator('.v5-postcard-caption strong')).toHaveText('城市故事交换所');
  await page.getByRole('button', { name: /明信片正面，点击翻面/ }).click();
  await ready(page, 'POSTCARD');
  await expect(page.locator('.v5-postcard-object')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.v5-postcard-writing')).toContainText('城市故事交换所');
  await page.getByRole('button', { name: /返回活动详情/ }).click();
  await ready(page, 'DETAIL');
  await expect(page.locator('.v5-sheet-title')).toHaveText('城市故事交换所');
});

test('V5 收藏、翻面中确认、返回首页、刷新清空', async ({ page }) => {
  await open(page);
  await choose(page, 1);
  await page.getByRole('button', { name: '取出纪念明信片' }).click();
  await ready(page, 'POSTCARD');
  await page.getByRole('button', { name: /明信片正面，点击翻面/ }).click();
  await page.getByRole('button', { name: /收下这张明信片/ }).click();
  await ready(page, 'COMPLETE');
  await expect(page.locator('.v5-complete-event strong')).toHaveText('把冬天印在纸上');
  await expect(page.locator('.v5-collect-stamp')).toBeVisible();
  const card = await page.locator('.v5-postcard-object').boundingBox();
  const sleeve = await page.locator('.v5-kept-front').boundingBox();
  expect(card!.y + card!.height).toBeLessThan(sleeve!.y + sleeve!.height + 8);
  await page.getByRole('button', { name: /完成体验，返回首页/ }).click();
  await ready(page, 'IDLE');
  await expect(page.getByRole('button', { name: '打开校园来信', exact: true })).toBeFocused();
  await page.reload();
  await ready(page, 'IDLE');
  await expect(page.locator('.v5-complete-copy')).not.toBeVisible();
});

test('V5 触摸首点聚焦、二点打开及 reduced-motion', async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: info.project.use.viewport, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await open(page);
  const first = page.locator('.v5-event-hit').first();
  const second = page.locator('.v5-event-hit').nth(1);
  await first.tap();
  await ready(page, 'DISCOVER');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await second.tap();
  await ready(page, 'DISCOVER');
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await second.tap();
  await ready(page, 'DETAIL');
  await expect(page.locator('.v5-sheet-title')).toHaveText('把冬天印在纸上');
  expect(await page.locator('.v5').getAttribute('data-gusts')).toBe('0');
  await context.close();
});

test('V5 快速筛选、动画中重置、键盘完整主路径', async ({ page }) => {
  await page.goto('/');
  await ready(page, 'IDLE');
  await page.getByRole('button', { name: '打开校园来信', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /重新开始/ }).click();
  await ready(page, 'IDLE');
  await open(page);
  await page.getByRole('button', { name: '澳门大学', exact: true }).click();
  await page.getByRole('button', { name: '澳门理工大学', exact: true }).click();
  await page.getByRole('button', { name: '全部来信', exact: true }).click();
  await expect(page.getByRole('button', { name: '全部来信', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await ready(page, 'DISCOVER');
  await expect(page.locator('.v5-event')).toHaveCount(3);
  await page.locator('.v5-event-hit').first().focus();
  await page.keyboard.press('Enter');
  await ready(page, 'DETAIL');
  await page.getByRole('button', { name: '取出纪念明信片' }).focus();
  await page.keyboard.press('Enter');
  await ready(page, 'POSTCARD');
  await page.keyboard.press('Space');
  await ready(page, 'POSTCARD');
  await expect(page.locator('.v5-postcard-object')).toHaveAttribute('aria-pressed', 'true');
});

test('V5 会话超时、继续与自动重置', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?idle=1200');
  await ready(page, 'IDLE');
  await page.getByRole('button', { name: '打开校园来信', exact: true }).click();
  await ready(page, 'DISCOVER');
  await expect(page.locator('.v5-dialog')).toBeVisible({ timeout: 6000 });
  await page.getByRole('button', { name: '继续探索', exact: true }).click();
  await expect(page.locator('.v5-dialog')).not.toBeVisible();
  await expect(page.locator('.v5-dialog')).toBeVisible({ timeout: 6000 });
  await ready(page, 'IDLE');
});

test('V5 缺失明信片与空学校仍可恢复', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/src/data.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()) + '\nschools[0].id = "empty"; postcards.splice(0);\n' });
  });
  await open(page);
  await page.getByRole('button', { name: '澳门大学', exact: true }).click();
  await ready(page, 'DISCOVER');
  await expect(page.getByRole('heading', { name: '新的故事，还在路上' })).toBeVisible();
  await page.getByRole('button', { name: '查看全部来信', exact: true }).click();
  await ready(page, 'DISCOVER');
  await choose(page);
  await expect(page.getByRole('button', { name: '明信片正在准备中' })).toBeDisabled();
  await page.getByRole('button', { name: '返回选择其他活动' }).click();
  await ready(page, 'DISCOVER');
});
