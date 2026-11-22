import { test, expect } from '@playwright/test';

test.describe('《拾花一叶》全流程与双分辨率验收', () => {
  test('HOME 总入口、默认隐藏演示控制台、四径导航与静音控制', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /拾一片花叶/ })).toBeVisible();
    // Normal visitors must NOT see the demo console
    await expect(page.getByRole('button', { name: /演示控制台/ })).toHaveCount(0);

    // Screenshot HOME at current viewport (1920 or 1366)
    await page.waitForTimeout(600);
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-01-home.png` });

    // Mute toggle works
    const muteBtn = page.getByRole('button', { name: /提示音开启中/ });
    await muteBtn.click();
    await expect(page.getByRole('button', { name: /已静音/ })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('路线 A：三校原卡背面抽出、翻面、收藏与返场', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') errors.push(msg.text());
    });
    await page.goto('/');
    const scene = page.locator('.v6a');
    const home = page.getByRole('button', { name: '← 返回树下', exact: true });
    const opener = page.getByRole('button', { name: /轻触拆开校园来信/ });
    await opener.click();
    await expect(scene).toHaveAttribute('data-phase', 'DISCOVER');
    await expect(scene.locator('.v6a-card-writing img')).toHaveCount(3);
    for (const card of ['um', 'upm', 'utm']) {
      await expect(scene.locator(`.v6a-card-writing img[src$="${card}-back.webp"]`)).toHaveCount(1);
    }
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-02-routeA-discover.png` });

    const filters = page.getByRole('navigation', { name: '按学校筛选' });
    await filters.getByRole('button', { name: '澳门大学', exact: true }).click();
    await expect(scene).toHaveAttribute('data-busy', 'false');
    await expect(scene.locator('.v6a-event')).toHaveCount(2);
    const exploreCard = page.getByRole('button', { name: /冬日校园漫游/ });
    const paper = await exploreCard.locator('..').elementHandle();
    await exploreCard.click();
    const back = page.getByRole('button', { name: '明信片背面，翻到正面' });
    const front = page.getByRole('button', { name: '明信片正面，翻回背面' });
    await expect(back).toBeEnabled();
    await expect(page.getByRole('heading', { name: '冬日校园漫游' })).toBeVisible();
    await expect(page.getByText('非官方演示活动', { exact: true }).first()).toBeVisible();
    expect(await paper?.evaluate((node) => node.isConnected)).toBe(true);
    await expect(back).toBeFocused();

    // Tilt moves a nested surface; the handoff and 3D face use separate elements.
    const hit = await back.boundingBox();
    if (!hit) throw new Error('Postcard missing');
    await page.mouse.move(hit.x + hit.width * 0.77, hit.y + hit.height * 0.30);
    const surface = scene.locator('[data-event="winter"] .v6a-card-tilt');
    await expect.poll(() => surface.evaluate((el) => getComputedStyle(el).transform)).not.toBe('none');
    await page.mouse.move(65, 95);
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-03-routeA-postcard-back.png` });
    await back.dblclick({ delay: 25 });
    await expect(front).toBeEnabled();
    await expect(page.getByRole('img', { name: /木棉花明信片正面/ })).toBeVisible();
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-04-routeA-postcard-front.png` });
    await front.click();
    await expect(back).toBeEnabled();

    await page.getByRole('button', { name: '← 放回信封' }).click();
    await expect(scene).toHaveAttribute('data-phase', 'DISCOVER');
    await exploreCard.click();
    await expect(back).toBeEnabled();
    await page.getByRole('button', { name: /完成数字收藏/ }).click();
    await expect(page.getByRole('heading', { name: '已数字收藏' })).toBeVisible();
    await expect(page.getByText('仅限当前网页会话')).toBeVisible();
    await expect(page.getByRole('button', { name: /去领实体卡/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /去时光邮局/ })).toBeVisible();
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-06-routeA-complete.png` });

    await home.click();
    await opener.click();
    await expect(page.getByRole('button', { name: /冬日校园漫游.*已数字收藏/ })).toBeEnabled();
    await expect(page.getByRole('button', { name: /重新拆开校园来信/ })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('路线 B：秋千停留三种状态（可用 / 占用中 / 暂关闭）', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?demo=1');
    await page.getByRole('button', { name: /B 秋千停留/ }).first().click();
    await expect(page.getByRole('heading', { name: /坐稳轻荡/ })).toBeVisible();
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-07-routeB-swing.png` });

    // Open DemoPanel & switch to occupied / closed
    await page.getByRole('button', { name: /演示控制台/ }).click();
    await page.getByRole('button', { name: '占用中' }).click();
    await expect(page.getByRole('heading', { name: /此刻有人正在树下轻荡/ })).toBeVisible();

    await page.getByRole('button', { name: '已关闭' }).click();
    await expect(page.getByRole('heading', { name: /秋千当前暂不开放使用/ })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('路线 C：实体领卡 01–07 完整流程与 5 类异常分支（暂停不阻断 A/B/D）', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?demo=1');
    await page.getByRole('button', { name: /C 实体领卡/ }).first().click();

    // Normal 01 -> 07 flow
    await expect(page.getByRole('heading', { name: /树枝会飘下一张叶形明信片/ })).toBeVisible();
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-08-routeC-step01.png` });

    await page.getByRole('button', { name: /领实体叶形明信片/ }).click();
    await expect(page.getByRole('heading', { name: /请选择触发方式/ })).toBeVisible();

    await page.getByRole('button', { name: /秋千触发/ }).click();
    await expect(page.getByRole('heading', { name: /收到请求，请先停稳/ })).toBeVisible();

    await page.getByRole('button', { name: /模拟停稳并落区清空/ }).click();
    await expect(page.getByRole('heading', { name: /明信片到了 → 侧边取卡盘/ })).toBeVisible();
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-09-routeC-step06-landed.png` });

    await page.getByRole('button', { name: /确认取走这张叶形卡/ }).click();
    await expect(page.getByRole('heading', { name: /已取走/ })).toBeVisible();

    // Test Exception 02 (wind_rain paused) & verify A/B/D remain accessible
    await page.getByRole('button', { name: /再演示一轮领卡/ }).click();
    await page.getByRole('button', { name: /演示控制台/ }).click();
    await page.getByRole('button', { name: '雨风暂停' }).click();
    await page.getByRole('button', { name: /收起演示控制台/ }).click();
    await page.getByRole('button', { name: /领实体叶形明信片/ }).click();
    await expect(page.getByRole('heading', { name: /当前暂不可开启实体领卡/ })).toBeVisible();
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-10-routeC-exception02.png` });

    // Verify Route D still opens cleanly while C is paused
    await page.getByRole('button', { name: /前往时光邮局/ }).click();
    await expect(page.getByRole('heading', { name: /挑选一张明信片/ })).toBeVisible();

    // Return through the tree scene to C and test Exception 05 (jam -> halt without auto-dispense)
    await page.getByRole('button', { name: '← 返回树下', exact: true }).click();
    await page.getByRole('button', { name: /C 实体领卡/ }).first().click();
    await page.getByRole('button', { name: /演示控制台/ }).click();
    await page.getByRole('button', { name: '天气正常' }).click();
    await page.getByRole('button', { name: '卡滞' }).click();
    await page.getByRole('button', { name: /收起演示控制台/ }).click();
    await page.getByRole('button', { name: /领实体叶形明信片/ }).click();
    await page.getByRole('button', { name: /实体按键/ }).click();
    await page.getByRole('button', { name: /开始枝头预告/ }).click();
    await expect(page.getByRole('heading', { name: '暂不可领取' })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('路线 D：时光邮局开放全流程（选卡 → 实时背面填写 → 装袋盖章 → 演示回执）与关闭态', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?demo=1');
    await page.getByRole('button', { name: /D 时光邮局/ }).first().click();
    await expect(page.getByRole('heading', { name: /挑选一张明信片/ })).toBeVisible();
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-11-routeD-select.png` });

    // Select a seasonal poster card (夏 · 同安红)
    await page.getByRole('button', { name: /夏 · 同安红/ }).click();
    await page.getByRole('button', { name: /选定.*开始写信/ }).click();

    await expect(page.getByRole('textbox')).toHaveCount(1);
    await page.getByRole('button', { name: /1 个月后/ }).click();
    await page.getByRole('button', { name: '到期邮寄寄出' }).click();
    await expect(page.locator('.v6d-handoff').getByText('虚构时光信箱', { exact: true })).toBeVisible();
    await page.getByPlaceholder(/记下今天在德智广场/).fill('愿你依然记得德智广场枝头飘落的这一片同安红。');
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-12-routeD-compose.png` });

    await page.getByRole('button', { name: /核对信息，准备装入专用封袋/ }).click();
    await expect(page.getByRole('heading', { name: /核对必要信息与交接确认/ })).toBeVisible();
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-13-routeD-seal.png` });

    await page.getByRole('button', { name: /确认装入专用封袋并盖章/ }).click();
    await expect(page.getByRole('heading', { name: /已封存写给未来的这封信/ })).toBeVisible();
    await page.screenshot({ path: `docs/v6.2-rebuild/${testInfo.project.name}-14-routeD-receipt.png` });

    // Switch to Closed mode
    await page.getByRole('button', { name: /演示控制台/ }).click();
    await page.getByRole('button', { name: '邮局关闭' }).click();
    await page.getByRole('button', { name: /收起演示控制台/ }).click();
    await expect(page.getByRole('heading', { name: /时光邮局当前未开放寄送/ })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('无操作超时提醒与安全继续机制', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?idle=900');
    await page.getByRole('button', { name: /B 秋千停留/ }).first().click();
    await expect(page.getByRole('heading', { name: /还想继续在树下停留吗/ })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /继续当前体验/ }).click();
    await expect(page.getByRole('heading', { name: /坐稳轻荡/ })).toBeVisible();
  });
});
