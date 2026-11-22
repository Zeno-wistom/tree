import { expect, test } from '@playwright/test';

test.use({ hasTouch: true });

test('触控放大、下沉、开信五轮及中途返回恢复', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const scene = page.locator('.v6a');
  const opener = page.getByRole('button', { name: /轻触拆开校园来信/ });
  const home = page.getByRole('button', { name: '← 返回树下', exact: true });

  const envelope = await scene.locator('.v6a-envelope').elementHandle();
  if (!envelope) throw new Error('Missing shared envelope');

  const assertShared = async () => {
    await expect(scene.locator('.v6a-envelope')).toHaveCount(1);
    expect(await envelope.evaluate((node) => node.isConnected && node === document.querySelector('.v6a-envelope'))).toBe(true);
  };

  await expect(opener).toBeEnabled();
  const homePose = await envelope.evaluate((node) => getComputedStyle(node).transform);
  const observeOpening = () => envelope.evaluate((node) => {
    type Frame = {
      elapsed: number;
      sameNode: boolean;
      x: number;
      y: number;
      scale: number;
      flap: number;
      seal: number;
      paper: number;
      paperAlpha: number;
    };
    type Scene = HTMLElement & { openingFrames?: Promise<Frame[]> };

    const scene = node.closest<Scene>('.v6a')!;
    const flap = node.querySelector('.v6a-envelope-flap')!;
    const seal = node.querySelector('.v6a-seal')!;
    const paper = node.querySelector('.v6a-event')!;
    const frames: Frame[] = [];
    const matrix = (element: Element) => new DOMMatrix(getComputedStyle(element).transform);
    const start = performance.now();
    scene.openingFrames = new Promise((resolve) => {
      const record = () => {
        const position = matrix(node);
        const lid = matrix(flap);
        frames.push({
          elapsed: performance.now() - start,
          sameNode: node.isConnected && node === document.querySelector('.v6a-envelope'),
          x: position.m41,
          y: position.m42,
          scale: Math.hypot(position.m11, position.m12),
          flap: Math.acos(Math.min(1, Math.max(-1, lid.m22))) * 180 / Math.PI,
          seal: Number(getComputedStyle(seal).opacity),
          paper: matrix(paper).m42,
          paperAlpha: Number(getComputedStyle(paper).opacity),
        });
        if (scene.dataset.phase === 'DISCOVER' || performance.now() - start > 4000) {
          resolve(frames);
        } else {
          requestAnimationFrame(record);
        }
      };
      record();
    });
  });

  for (let run = 0; run < 5; run++) {
    await observeOpening();
    await opener.tap();
    await expect(scene).toHaveAttribute('data-phase', 'DISCOVER');
    const frames = await scene.evaluate((node) =>
      (node as HTMLElement & { openingFrames: Promise<Array<{
        elapsed: number; sameNode: boolean; x: number; y: number; scale: number;
        flap: number; seal: number; paper: number; paperAlpha: number;
      }>> }).openingFrames,
    );

    expect(frames.length).toBeGreaterThan(15);
    expect(frames.every((frame) => frame.sameNode)).toBe(true);
    expect(frames.some((frame) => frame.scale > 0.68 && frame.flap < 5)).toBe(true);
    expect(frames.some((frame) => frame.y > 330 && frame.flap < 5)).toBe(true);
    expect(frames.some((frame) => frame.seal < 0.95 && frame.flap > 30 && frame.flap < 165)).toBe(true);
    // Authored poses are +180 (inside the pocket) and -298 (left card fully fanned).
    // A visible intermediate excludes a cut between those two endpoints.
    const extraction = frames.filter((frame) => frame.paperAlpha > 0.95);
    expect(extraction.some((frame) => frame.paper < 175 && frame.paper > -285),
      `Opening ${run + 1}: visible paper poses ${extraction.filter((_, i) => i % 3 === 0).map((f) => f.paper.toFixed(0)).join(', ')}`,
    ).toBe(true);
    expect(frames.at(-1)?.flap).toBeCloseTo(174, 0);
    expect(frames.at(-1)?.paper).toBeCloseTo(-298, 0);

    // Compare neighbouring paints in logical stage pixels. Account for real frame timing on slower kiosk hardware.
    for (let index = 1; index < frames.length; index++) {
      const prev = frames[index - 1];
      const current = frames[index];
      const delta = Math.hypot(current.x - prev.x, current.y - prev.y);
      expect(delta).toBeLessThan(14 + (current.elapsed - prev.elapsed) * 1.1);
    }

    if (run === 0) {
      await page.screenshot({ path: `docs/v6.2/${testInfo.project.name}-15-opening-end.png` });
    }
    await home.tap();
    await expect(opener).toBeEnabled();
    await assertShared();
    expect(await envelope.evaluate((node) => getComputedStyle(node).transform)).toBe(homePose);
  }

  await opener.tap();
  await expect(scene).toHaveAttribute('data-phase', 'OPENING');
  await expect.poll(() => envelope.evaluate((node) =>
    Number(getComputedStyle(node.querySelector('.v6a-seal')!).opacity),
  )).toBeLessThan(0.8);
  await home.tap();
  await expect(opener).toBeEnabled();
  await assertShared();
  expect(await envelope.evaluate((node) => getComputedStyle(node).transform)).toBe(homePose);
  await opener.tap();
  await expect(scene).toHaveAttribute('data-phase', 'DISCOVER');
  await assertShared();
  expect(errors).toEqual([]);
});
