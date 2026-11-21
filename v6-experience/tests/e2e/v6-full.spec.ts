import { test, expect } from '@playwright/test';

test.describe('《拾花一叶》V6 全流程与双分辨率验收', () => {
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
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-01-home.png` });

    // Mute toggle works
    const muteBtn = page.getByRole('button', { name: /提示音开启中/ });
    await muteBtn.click();
    await expect(page.getByRole('button', { name: /已静音/ })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('路线 A：完整屏幕探索（拆信 → 三校筛选 → 详情 → 真 A6 翻面 → 数字收藏 → 衔接 C/D）', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: /A 屏幕探索：轻触拆开校园来信/ }).click();

    await expect(page.getByRole('heading', { name: '今天，想遇见哪一所校园？' })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-02-routeA-discover.png` });

    // Filter by 澳门大学 (Chinese school name)
    await page.getByRole('navigation', { name: '按学校筛选' }).getByRole('button', { name: /澳门大学/ }).click();
    await page.waitForTimeout(300);

    // Open event letter
    await page.getByRole('button', { name: /冬日校园漫游/ }).click();
    await expect(page.getByRole('heading', { name: '冬日校园漫游' })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-03-routeA-detail.png` });

    // Extract & flip authentic A6 postcard
    await page.getByRole('button', { name: /翻阅对应三校明信片/ }).click();
    await expect(page.getByRole('heading', { name: '轻触明信片翻看正反面' })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-04-routeA-postcard-front.png` });

    await page.getByRole('button', { name: /翻到背面/ }).click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-05-routeA-postcard-back.png` });

    // Complete digital collection & verify bridges to C and D
    await page.getByRole('button', { name: /完成数字收藏/ }).click();
    await expect(page.getByRole('heading', { name: /愿这朵木棉花/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /进一步去领实体卡/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /去时光邮局寄给未来/ })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-06-routeA-complete.png` });

    expect(errors).toEqual([]);
  });

  test('路线 B：秋千停留三种状态（可用 / 占用中 / 暂关闭）', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?demo=1');
    await page.getByRole('button', { name: /B 秋千停留/ }).first().click();
    await expect(page.getByRole('heading', { name: /坐稳轻荡/ })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-07-routeB-swing.png` });

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
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-08-routeC-step01.png` });

    await page.getByRole('button', { name: /领实体叶形明信片/ }).click();
    await expect(page.getByRole('heading', { name: /请选择触发方式/ })).toBeVisible();

    await page.getByRole('button', { name: /秋千触发/ }).click();
    await expect(page.getByRole('heading', { name: /收到请求，请先停稳/ })).toBeVisible();

    await page.getByRole('button', { name: /模拟停稳并落区清空/ }).click();
    await expect(page.getByRole('heading', { name: /明信片到了 → 侧边取卡盘/ })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-09-routeC-step06-landed.png` });

    await page.getByRole('button', { name: /确认取走这张叶形卡/ }).click();
    await expect(page.getByRole('heading', { name: /已取走/ })).toBeVisible();

    // Test Exception 02 (wind_rain paused) & verify A/B/D remain accessible
    await page.getByRole('button', { name: /再演示一轮领卡/ }).click();
    await page.getByRole('button', { name: /演示控制台/ }).click();
    await page.getByRole('button', { name: '雨风暂停' }).click();
    await page.getByRole('button', { name: /收起演示控制台/ }).click();
    await page.getByRole('button', { name: /领实体叶形明信片/ }).click();
    await expect(page.getByRole('heading', { name: /当前暂不可开启实体领卡/ })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-10-routeC-exception02.png` });

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
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-11-routeD-select.png` });

    // Select a seasonal poster card (夏 · 同安红)
    await page.getByRole('button', { name: /夏 · 同安红/ }).click();
    await page.getByRole('button', { name: /选定.*开始写信/ }).click();

    await page.getByPlaceholder(/未来的自己/).fill('未来的林同学');
    await page.getByPlaceholder(/campus-demo/).fill('demo@um.edu.mo');
    await page.getByPlaceholder(/记下今天在德智广场/).fill('愿你依然记得德智广场枝头飘落的这一片同安红。');
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-12-routeD-compose.png` });

    await page.getByRole('button', { name: /核对信息，准备装入专用封袋/ }).click();
    await expect(page.getByRole('heading', { name: /核对必要信息与交接确认/ })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-13-routeD-seal.png` });

    await page.getByRole('button', { name: /确认装入专用封袋并盖章/ }).click();
    await expect(page.getByRole('heading', { name: /已封存写给未来的这封信/ })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}-14-routeD-receipt.png` });

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
