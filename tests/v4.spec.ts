import { test, expect } from '@playwright/test';

const phase = (page: import('@playwright/test').Page) => page.getAttribute('.v4', 'data-phase');
const waitPhase = (page: import('@playwright/test').Page, p: string) =>
  page.waitForFunction(x => document.querySelector('.v4')?.getAttribute('data-phase') === x, p, { timeout: 15000 });

test.describe('V4 · 首帧与开封', () => {
  test('静态首帧在没有 JavaScript 时也是完整信封', async ({ page }) => {
    await page.route('**/src/main.tsx', r => r.abort());
    await page.goto('/');
    await expect(page.locator('#first-frame .flap-title')).toBeVisible();
    const box = await page.locator('#first-frame .env-layer').boundingBox();
    expect(box && box.width > 400).toBeTruthy();
    // no loading copy may be visible in the shell
    await expect(page.locator('#first-frame')).not.toContainText('正在准备');
  });

  test('挂载后首帧被无缝接管，且不残留占位层', async ({ page }) => {
    await page.goto('/');
    await waitPhase(page, 'IDLE');
    await expect(page.locator('#first-frame')).toHaveCount(0);
    await expect(page.locator('.flap-title')).toBeVisible();
  });

  test('用户点击后才开封，并进入活动页', async ({ page }) => {
    await page.goto('/');
    await waitPhase(page, 'IDLE');
    await page.getByRole('button', { name: '打开校园来信' }).click();
    await waitPhase(page, 'DISCOVER');
    await expect(page.locator('.fan-card')).toHaveCount(6);
    await expect(page.locator('.discover-title')).toBeVisible();
  });

  test('连点不会卡死或重复触发', async ({ page }) => {
    await page.goto('/');
    await waitPhase(page, 'IDLE');
    const btn = page.getByRole('button', { name: '打开校园来信' });
    await btn.click({ clickCount: 3, delay: 30 }).catch(() => {});
    await waitPhase(page, 'DISCOVER');
    await expect(page.locator('.v4')).toHaveAttribute('data-phase', 'DISCOVER');
    await expect(page.locator('.fan-card')).toHaveCount(6);
  });
});

test.describe('V4 · 活动信封', () => {
  test('聚焦时卡片抬起，相邻卡片让位', async ({ page }) => {
    await page.goto('/');
    await waitPhase(page, 'IDLE');
    await page.getByRole('button', { name: '打开校园来信' }).click();
    await waitPhase(page, 'DISCOVER');
    const first = page.locator('.fan-card').first();
    const before = await first.evaluate(el => getComputedStyle(el).transform);
    await first.hover();
    await page.waitForTimeout(500);
    const after = await first.evaluate(el => getComputedStyle(el).transform);
    expect(after).not.toBe(before);
    await expect(first).toHaveClass(/is-focus/);
    await expect(page.locator('.tray-title')).toBeVisible();
  });

  test('学校筛选会换一组来信', async ({ page }) => {
    await page.goto('/');
    await waitPhase(page, 'IDLE');
    await page.getByRole('button', { name: '打开校园来信' }).click();
    await waitPhase(page, 'DISCOVER');
    await page.getByRole('button', { name: '澳门大学', exact: true }).click();
    await page.waitForTimeout(900);
    await expect(page.locator('.fan-card')).toHaveCount(2);
    const ids = await page.locator('.fan-card').evaluateAll(ns => ns.map(n => n.getAttribute('data-id')));
    expect(ids).toEqual(['winter', 'music']);
  });

  test('活动详情 → 明信片 → 收藏 → 回到待机', async ({ page }) => {
    await page.goto('/');
    await waitPhase(page, 'IDLE');
    await page.getByRole('button', { name: '打开校园来信' }).click();
    await waitPhase(page, 'DISCOVER');
    await page.locator('.fan-card').nth(2).hover();
    await page.waitForTimeout(400);
    await page.locator('.fan-card').nth(2).locator('.card-hit').click();
    await waitPhase(page, 'DETAIL');
    await expect(page.locator('.sheet-title')).toHaveText('一口暖暖的澳门');

    await page.getByRole('button', { name: /放回来信/ }).click();
    await waitPhase(page, 'DISCOVER');

    await page.locator('.fan-card').nth(2).hover();
    await page.waitForTimeout(400);
    await page.locator('.fan-card').nth(2).locator('.card-hit').click();
    await waitPhase(page, 'DETAIL');
    await page.getByRole('button', { name: /抽出纪念明信片/ }).click();
    await waitPhase(page, 'POSTCARD');

    const pc = page.locator('.pc-object');
    await expect(pc).toHaveAttribute('aria-pressed', 'false');
    await pc.click();
    await expect(pc).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: /收下这张明信片/ }).click();
    await waitPhase(page, 'COMPLETE');
    await expect(page.locator('.complete-picked strong')).toHaveText('一口暖暖的澳门');

    await page.getByRole('button', { name: /完成体验/ }).click();
    await waitPhase(page, 'IDLE');
    await expect(page.locator('.flap-title')).toBeVisible();
  });

  test('连续翻转后仍停在完整的一面', async ({ page }) => {
    await page.goto('/');
    await waitPhase(page, 'IDLE');
    await page.getByRole('button', { name: '打开校园来信' }).click();
    await waitPhase(page, 'DISCOVER');
    await page.locator('.fan-card').first().hover();
    await page.waitForTimeout(350);
    await page.locator('.fan-card').first().locator('.card-hit').click();
    await waitPhase(page, 'DETAIL');
    await page.getByRole('button', { name: /抽出纪念明信片/ }).click();
    await waitPhase(page, 'POSTCARD');
    const pc = page.locator('.pc-object');
    for (let i = 0; i < 4; i++) { await pc.click({ force: true }).catch(() => {}); await page.waitForTimeout(130); }
    await page.waitForTimeout(1400);
    const pressed = await pc.getAttribute('aria-pressed');
    expect(['true', 'false']).toContain(pressed);
    const inner = await page.locator('.pc-inner').evaluate(el => getComputedStyle(el).transform);
    expect(inner).not.toBe('none');
  });
});

test.describe('V4 · 无障碍与降级', () => {
  test('reduced motion 下不播放环境风', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitPhase(page, 'IDLE');
    await page.waitForTimeout(1200);
    const leaf = await page.locator('.leaf-1').evaluate(el => getComputedStyle(el).opacity);
    expect(Number(leaf)).toBeLessThan(0.05);
    await page.getByRole('button', { name: '打开校园来信' }).click();
    await waitPhase(page, 'DISCOVER');
  });

  test('空闲超时会弹窗并可以继续', async ({ page }) => {
    await page.goto('/?idle=1200');
    await waitPhase(page, 'IDLE');
    await page.getByRole('button', { name: '打开校园来信' }).click();
    await waitPhase(page, 'DISCOVER');
    await page.waitForTimeout(2400);
    await expect(page.locator('dialog.v4-dialog')).toHaveAttribute('open', '');
    await page.getByRole('button', { name: /继续探索/ }).click();
    await expect(page.locator('dialog.v4-dialog')).not.toHaveAttribute('open', '');
    await expect(page.locator('.v4')).toHaveAttribute('data-phase', 'DISCOVER');
  });

  test('键盘可以打开信封', async ({ page }) => {
    await page.goto('/');
    await waitPhase(page, 'IDLE');
    const open = page.getByRole('button', { name: '打开校园来信' });
    await expect(open).toHaveAttribute('tabindex', '0');
    await open.focus();
    await page.keyboard.press('Enter');
    await waitPhase(page, 'DISCOVER');
    await expect(page.locator('.v4')).toHaveAttribute('data-phase', 'DISCOVER');
  });
});
