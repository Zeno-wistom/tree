import { expect, test } from '@playwright/test';

test('B 与 D 正常动效、卡片拖动和离场重置', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());
  });
  const home = page.getByRole('button', { name: '← 返回树下', exact: true });
  const swing = page.getByRole('button', { name: 'B 秋千停留' });
  const post = page.getByRole('button', { name: 'D 时光邮局' });
  const choose = page.getByRole('button', { name: /选定.*开始写信/ });
  const draft = page.getByRole('textbox', { name: '写给未来的自己' });

  await page.goto('/');
  await swing.click();
  await expect(page.getByRole('heading', { name: /坐稳轻荡/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /演示控制台/ })).toHaveCount(0);
  await page.getByRole('button', { name: /再看一次轻荡/ }).click();
  await expect.poll(() => page.locator('.v6b-swing-rig').evaluate((node) =>
    getComputedStyle(node).transform)).not.toBe('none');
  await page.screenshot({ path: `docs/v6.2/${testInfo.project.name}-07-routeB-visitor.png` });
  await home.click();
  await expect(swing).toBeEnabled();
  await post.click();

  const flip = page.getByRole('button', { name: '翻到背面', exact: true });
  await expect(flip).toBeVisible();
  await expect(page.locator('.v6-root[data-scene-transition]')).toHaveCount(0);
  const hit = await flip.boundingBox();
  if (!hit) throw new Error('Postcard absent');
  const selected = page.getByRole('navigation', { name: '明信片款式' }).locator('button[aria-pressed=true]');
  const first = await selected.textContent();
  const center = hit.y + hit.height / 2;
  await page.mouse.move(hit.x + hit.width * 0.72, center);
  await page.mouse.down();
  await page.mouse.move(hit.x + hit.width * 0.24, center, { steps: 8 });
  await page.mouse.up();
  await expect(selected).not.toHaveText(first ?? '');
  await flip.click();
  await expect(page.getByRole('button', { name: '翻到正面', exact: true })).toBeVisible();

  await choose.click();
  await draft.fill('这句话应随离场而清空。');
  await home.click();
  await expect(post).toBeEnabled();
  await post.click();
  await choose.click();
  await expect(draft).toBeEmpty();
  expect(errors).toEqual([]);
});

test('C 支持四季主题且访客场景隐藏演示抽屉', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [season, label] of [
    ['spring', '春 · 绿樱'], ['summer', '夏 · 同安红'],
    ['autumn', '秋 · 加州黄金'], ['winter', '冬 · 漳红樱'],
  ]) {
    await page.goto('/?season=' + season);
    await page.getByRole('button', { name: 'C 实体领卡', exact: true }).click();
    const atlas = page.getByRole('region', { name: '四季叶形卡预览' });
    await expect(atlas.locator('figure')).toHaveCount(4);
    await expect(atlas.locator('figure[data-current]')).toHaveText(label);
    await expect(atlas.locator('figure[data-current] img')).toHaveAttribute('src', new RegExp(season + '-front\\.png$'));
    await expect(page.getByText('C 演示工具', { exact: true })).toHaveCount(0);
    if (season === 'spring') {
      await page.screenshot({ path: `docs/v6.2/${testInfo.project.name}-08-routeC-visitor.png` });
    }
  }
});
