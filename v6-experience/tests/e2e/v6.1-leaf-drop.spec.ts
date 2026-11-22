import { expect, test, type Page } from '@playwright/test';

async function enterLeafDrop(page: Page, demo = false) {
  await page.goto(demo ? '/?demo=1' : '/');
  await page.getByRole('button', { name: 'C 实体领卡' }).click();
  await expect(page.locator('.v6c')).toHaveAttribute('data-step', '1');
}

async function setDemo(page: Page, label: string) {
  await page.getByRole('button', { name: /演示控制台/ }).click();
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('button', { name: /收起演示控制台/ }).click();
}

async function requestLeaf(page: Page, trigger: '实体按键' | '秋千触发' = '实体按键') {
  await page.getByRole('button', { name: /领实体叶形明信片/ }).click();
  await page.getByRole('button', { name: new RegExp('^' + trigger) }).click();
}

test('C 普通访客看灯、等叶落稳并从侧盘取卡', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await enterLeafDrop(page);
  const leafScene = page.locator('.v6c');
  await expect(page.getByRole('button', { name: /演示控制台/ })).toHaveCount(0);
  await expect(leafScene.getByRole('list', { name: /七步流程/ })).toHaveCount(0);
  await page.getByRole('button', { name: /提示音开启中/ }).click();
  await expect(page.getByRole('button', { name: /已静音/ })).toBeVisible();
  await page.getByRole('button', { name: /领实体叶形明信片/ }).click();
  await expect(leafScene).toHaveAttribute('data-step', '2');
  await page.getByRole('button', { name: /^实体按键/ }).click();
  await expect(leafScene).toHaveAttribute('data-step', '4');
  await page.getByRole('button', { name: /开始枝头预告/ }).click();
  await expect(leafScene).toHaveAttribute('data-flight', 'signal');
  await expect(leafScene).toHaveAttribute('data-flight', 'drift');
  await expect(leafScene).toHaveAttribute('data-step', '6');
  await expect(page.getByRole('heading', { name: /明信片到了.*侧边取卡盘/ })).toBeVisible();
  const landingOffset = await leafScene.evaluate((scene) => {
    const leaf = scene.querySelector('.v6c-leaf-card')!.getBoundingClientRect();
    const tray = scene.querySelector('.v6c-tray')!.getBoundingClientRect();
    return Math.hypot(leaf.x + leaf.width / 2 - tray.x - tray.width / 2, leaf.y + leaf.height / 2 - tray.y - tray.height / 2);
  });
  expect(landingOffset).toBeLessThan(3);
  await page.screenshot({ path: testInfo.outputPath('visitor-landed.png') });
  await page.getByRole('button', { name: /确认取走这张叶形卡/ }).click();
  await expect(leafScene).toHaveAttribute('data-step', '7');
  await expect(page.getByRole('heading', { name: /已取走/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('C 五类异常及恢复路径，涵盖库存、停稳、零张、卡滞、双张、飞偏与遗留', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const scene = page.locator('.v6c');
  const start = () => page.getByRole('button', { name: /领实体叶形明信片/ }).click();
  const release = () => page.getByRole('button', { name: /开始枝头预告/ }).click();
  const exception = (kind: string) => expect(scene).toHaveAttribute('data-exception', kind);

  for (const [setting, kind] of [
    ['正忙', '02-busy'],
    ['主题卡领完', '02-empty'],
    ['雨风暂停', '02-paused'],
    ['故障暂停', '02-paused'],
    ['托盘占用', '02-paused'],
  ]) {
    await enterLeafDrop(page, true);
    await setDemo(page, setting);
    await start();
    await exception(kind);
    await expect(page.getByRole('button', { name: /确认取走这张叶形卡/ })).toHaveCount(0);
  }

  await enterLeafDrop(page, true);
  await requestLeaf(page, '秋千触发');
  await page.getByText('C 演示工具', { exact: true }).click();
  await page.getByRole('button', { name: /模拟未停稳/ }).click();
  await exception('03-04-unsafe');
  await expect(page.getByRole('button', { name: /确认取走这张叶形卡/ })).toHaveCount(0);
  await page.getByRole('button', { name: /改用实体按键触发/ }).click();
  await release();
  await expect(scene).toHaveAttribute('data-step', '6');

  for (const [outcome, text] of [
    ['零张', /零张/],
    ['卡滞', /卡滞/],
    ['疑似双张', /两张卡片/],
  ] as const) {
    await enterLeafDrop(page, true);
    await setDemo(page, outcome);
    await requestLeaf(page);
    await release();
    await exception('05-mechanical');
    await expect(scene.getByText(text).filter({ hasText: /发卡已暂停/ })).toBeVisible();
    await expect(scene.getByText('不会自动补发')).toBeVisible();
    await page.getByText('C 演示工具', { exact: true }).click();
    await page.getByRole('button', { name: /工作人员检查并复位/ }).click();
    await expect(scene).toHaveAttribute('data-step', '1');
  }

  await enterLeafDrop(page, true);
  await setDemo(page, '飞偏未落盘');
  await requestLeaf(page);
  await release();
  await exception('06-off-target');
  await page.getByText('C 演示工具', { exact: true }).click();
  await page.getByRole('button', { name: /工作人员确认并清盘恢复/ }).click();
  await expect(scene).toHaveAttribute('data-step', '1');

  await requestLeaf(page);
  await release();
  await page.getByRole('button', { name: '本轮不取卡' }).click();
  await exception('07-leftover');
  await page.getByText('C 演示工具', { exact: true }).click();
  await page.getByRole('button', { name: /工作人员清盘并恢复/ }).click();
  await expect(scene).toHaveAttribute('data-step', '1');

  await requestLeaf(page);
  await release();
  await expect(scene).toHaveAttribute('data-step', '6');
  const home = page.getByRole('button', { name: '← 返回树下', exact: true });
  await home.click();
  await page.getByRole('button', { name: 'C 实体领卡', exact: true }).click();
  await start();
  await exception('02-paused');
  await expect(scene.getByText(/尚有余卡/)).toBeVisible();
  await page.getByText('C 演示工具', { exact: true }).click();
  await page.getByRole('button', { name: /工作人员检查并恢复领卡/ }).click();
  await expect(scene).toHaveAttribute('data-step', '1');
});

test('C 枝端预告期间侧盘被占用时中止发卡', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await enterLeafDrop(page, true);
  await requestLeaf(page);
  await page.getByRole('button', { name: /演示控制台/ }).click();
  await page.getByRole('button', { name: /开始枝头预告/ }).click();
  await expect(page.locator('.v6c')).toHaveAttribute('data-flight', 'signal');
  await page.getByRole('button', { name: '托盘占用', exact: true }).click();
  await expect(page.locator('.v6c')).toHaveAttribute('data-exception', '02-paused');
  await expect(page.getByRole('button', { name: /确认取走这张叶形卡/ })).toHaveCount(0);
});
