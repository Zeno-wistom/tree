# 校园来信 · Campus Post

德志广场互动树的数字屏幕端原型。React + TypeScript + Vite，本地数据，无后端。

## 启动

```powershell
npm ci
npm run dev
```

打开终端输出的本地地址，默认 http://127.0.0.1:5173/ 。本轮 V5 验收使用 `npm run dev -- --port 5175`。生产包：`npm run build`，本地检查生产包：`npm run preview`。

## 版本入口

| 地址 | 内容 |
|---|---|
| `/` | **V5 拾花一叶**（`codex/v5-experience`） |
| `/?v4` | V4 视觉重构版（保留） |
| `/?v3` | V3 信封版（保留） |
| `/?v1` | V1 五页基线（保留） |
| `/?postoffice` | 邮局首页实验（保留） |

V5 的实现、素材替换、测试结果与限制见 [docs/v5/DELIVERY.md](docs/v5/DELIVERY.md)，截图、连续录屏与逐帧对比见 [V5 验收画廊](docs/v5/index.html)。

V4 的审计结论、实现要点、验收证据与已知不足见 [docs/V4_NOTES.md](docs/V4_NOTES.md)；
连续录屏 [docs/v4/v4-experience.mp4](docs/v4/v4-experience.mp4)，修复前后对比 `docs/v4/before-after-*.png`。

## 体验

开始探索 → 按学校筛选 → 打开活动 → 查看并翻转明信片 → 确认选择 → 返回首页。

活动、日期、地点和活动插画均为演示，建筑不代表真实校舍。V5 花叶矢量提取自用户提供的 `桃花.ai`。完成页仅代表内存中的数字选择，没有实体投递。首页、刷新、超时会清空会话。

## 内容替换

- `src/data.ts`：学校、活动、明信片、节日主题、90秒/15秒时间配置。保留唯一 ID，确保 Event.postcardId 与 Postcard.id、Postcard.eventId 双向匹配。
- `src/Art.tsx`：四套原创剪纸插画。当前 frontImage / coverImage 是插画 key；使用正式图片时需将 Art 渲染替换为图片渲染，并检验裁切。
- `src/style.css`：颜色、字体、响应式、动效与 reduced-motion。
- `src/main.tsx`：五页交互、当前会话、确认结果与超时提示。
- `src/v5/Experience.tsx`、`experience.css`：V5 空间流程、页面排版与视觉变量。
- `src/v5/art.tsx`、`public/v5/botanical-*.svg`：可独立替换的明信片正反面与花叶素材。

## 验证与证据

`npm test` 使用独立 Edge / Playwright，需本机已安装 Microsoft Edge。覆盖 1920×1080、1366×768 及 390px 窄屏。首次在其他电脑运行时请安装 Edge 或调整测试配置的浏览器 channel。

V5 数字屏幕专项：`npx playwright test --config playwright.v5.config.ts`，覆盖 1920×1080、1366×768。证据重采集：`node scripts/capture-v5.mjs all`（需先启动 5175 服务器）。V5 暂未将竖屏手机作为设计验收目标。

- [原始产品基线](docs/PRODUCT_BASELINE.md)
- [实施记录与假设](docs/IMPLEMENTATION_NOTES.md)
- [设计与交互规范](docs/DESIGN_SYSTEM.md)
- [验收报告](docs/QA_REPORT.md)
- [实际截图目录](docs/screenshots/)

未部署、未连接硬件。真实活动、官方素材、屏幕物理尺寸、现场观看距离、双语和最终节日主题仍待确认。
