import { expect, test, type Locator } from '@playwright/test';

test('全屏纸本布局、收藏口遮挡，以及从 A 带卡进入 D', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const viewport = page.viewportSize()!;
  const directory = 'docs/v6.2-rebuild';
  const screenshot = (state: string) => page.screenshot({ path: `${directory}/${testInfo.project.name}-space-${state}.png` });
  const withinScreen = async (locator: Locator) => {
    const bounds = await locator.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(-1);
    expect(bounds!.y).toBeGreaterThanOrEqual(-1);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
  };
  const home = page.getByRole('button', { name: '← 返回树下', exact: true });
  const envelope = page.locator('.v6a-envelope');
  const opening = page.getByRole('button', { name: /轻触拆开校园来信/ });

  expect(await page.locator('.v6-garden').boundingBox()).toEqual({ x: 0, y: 0, ...viewport });
  await withinScreen(envelope);
  for (const name of ['B 秋千停留', 'C 实体领卡', 'D 时光邮局']) {
    await withinScreen(page.getByRole('button', { name, exact: true }));
  }
  await screenshot('home');

  await opening.click();
  await expect(page.getByRole('heading', { name: '三校来信' })).toBeVisible();
  await withinScreen(envelope);
  await screenshot('open');
  const event = page.locator('.v6a-event-hit').nth(1);
  const item = page.locator('.v6a-event').nth(1);
  await event.click();
  await expect(page.getByRole('heading', { name: '炮仗花' })).toBeVisible();
  await withinScreen(item);
  await withinScreen(envelope);
  const reader = (await item.boundingBox())!;
  const restingEnvelope = (await envelope.boundingBox())!;
  expect(restingEnvelope.x + restingEnvelope.width).toBeLessThan(reader.x);
  await expect(event).toHaveAccessibleName(/明信片背面/);
  await event.click();
  await expect(event).toHaveAccessibleName(/明信片正面/);
  await expect(event).toBeEnabled();
  await page.getByRole('button', { name: /完成数字收藏/ }).click();
  await expect(page.getByRole('heading', { name: '已数字收藏' })).toBeVisible();
  await withinScreen(envelope);

  // The live card enters the same envelope and remains behind its front pocket.
  const layering = await envelope.evaluate((body) => {
    const fan = body.querySelector('.v6a-fan')!;
    const pocket = body.querySelector('.v6a-pocket')!;
    const card = fan.querySelectorAll('.v6a-event')[1];
    const cardBox = card.getBoundingClientRect();
    const pocketBox = pocket.getBoundingClientRect();
    return {
      behind: Number(getComputedStyle(fan).zIndex) < Number(getComputedStyle(pocket).zIndex),
      crossesMouth: cardBox.top < pocketBox.top + pocketBox.height * .29
        && cardBox.bottom > pocketBox.top + pocketBox.height * .3,
      withinFoot: cardBox.bottom < pocketBox.bottom,
    };
  });
  expect(layering).toEqual({ behind: true, crossesMouth: true, withinFoot: true });
  await screenshot('collect');

  await page.getByRole('button', { name: /去时光邮局/ }).click();
  await expect(page.locator('.v6d button[aria-pressed=true]')).toContainText('澳门理工大学');
  await withinScreen(page.locator('.v6d-card-stack'));
  await screenshot('post');

  await home.click();
  await page.getByRole('button', { name: 'B 秋千停留', exact: true }).click();
  await withinScreen(page.locator('.v6b-swing-svg'));
  await screenshot('swing');

  await home.click();
  await page.getByRole('button', { name: 'C 实体领卡', exact: true }).click();
  await withinScreen(page.locator('.v6c-tray'));
  await withinScreen(page.getByRole('button', { name: /领实体叶形明信片/ }));
  await screenshot('leaf');
  await page.getByRole('button', { name: /领实体叶形明信片/ }).click();
  await page.getByRole('button', { name: /^实体按键/ }).click();
  await page.getByRole('button', { name: /开始枝头预告/ }).click();
  const take = page.getByRole('button', { name: /确认取走这张叶形卡/ });
  await expect(take).toBeVisible();
  await withinScreen(take);
  await screenshot('leaf-landed');
  await take.click();
  await expect(page.getByRole('heading', { name: /^已取走/ })).toBeVisible();
  await home.click();
  await expect(opening).toBeEnabled();
  expect(errors).toEqual([]);
});
