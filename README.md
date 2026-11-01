# 校园来信 · Campus Post

德志广场互动树的数字屏幕端原型。React + TypeScript + Vite，本地数据，无后端。

## 启动

```powershell
npm ci
npm run dev
```

打开终端输出的本地地址，默认 http://127.0.0.1:5173/ 。生产包：`npm run build`，本地检查生产包：`npm run preview`。

## 体验

开始探索 → 按学校筛选 → 打开活动 → 查看并翻转明信片 → 确认选择 → 返回首页。

活动、日期、地点和明信片均为演示；全部插画为原创 SVG，建筑不代表真实校舍。完成页仅代表内存中的数字选择，没有实体投递。首页、刷新、超时会清空会话。

## 内容替换

- `src/data.ts`：学校、活动、明信片、节日主题、90秒/15秒时间配置。保留唯一 ID，确保 Event.postcardId 与 Postcard.id、Postcard.eventId 双向匹配。
- `src/Art.tsx`：四套原创剪纸插画。当前 frontImage / coverImage 是插画 key；使用正式图片时需将 Art 渲染替换为图片渲染，并检验裁切。
- `src/style.css`：颜色、字体、响应式、动效与 reduced-motion。
- `src/main.tsx`：五页交互、当前会话、确认结果与超时提示。

## 验证与证据

`npm test` 使用独立 Edge / Playwright，需本机已安装 Microsoft Edge。覆盖 1920×1080、1366×768 及 390px 窄屏。首次在其他电脑运行时请安装 Edge 或调整测试配置的浏览器 channel。

- [原始产品基线](docs/PRODUCT_BASELINE.md)
- [实施记录与假设](docs/IMPLEMENTATION_NOTES.md)
- [设计与交互规范](docs/DESIGN_SYSTEM.md)
- [验收报告](docs/QA_REPORT.md)
- [实际截图目录](docs/screenshots/)

未部署、未连接硬件。真实活动、官方素材、屏幕物理尺寸、现场观看距离、双语和最终节日主题仍待确认。
