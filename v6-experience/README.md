# 《拾花一叶》V6.1 · 德智广场互动树

以当前本地 V6 为基线，在 `codex/v6.1-experience` 独立工作树内开发。首页从四条路线的功能入口改为信封、树枝、秋千和明信片共处的互动场景。触碰信封后，同一个纸品对象连续展开成 A 路线。

## 快速开始

```bash
cd v6-experience
npm ci
npm run dev
```

- 默认开发地址：`http://127.0.0.1:5198/`
- 普通访客模式：`http://127.0.0.1:5198/`（隐藏演示控制面板，呈现纯净公共触屏界面）
- **课程评审演示模式**：`http://127.0.0.1:5198/?demo=1`（底部中央出现「演示控制台」，可实时切换春夏秋冬、秋千三态、发卡设备/库存/天气/托盘/5 类异常、邮局开闭与静音状态）
- 超时测试参数：`?idle=1000` 可缩短 90 秒无操作触发阈值以便快速验证。

## 构建与测试

```bash
# 生产构建（含 TypeScript 严格校验）
npm run build

# 本地预览生产包
npm run preview

# 单元测试（数据与素材映射完整性）
npm test

# 双分辨率端到端自动化验收（1920×1080 & 1366×768）
npx playwright install chromium
npm run test:e2e
```

## 独立部署

运行 `npm run build` 后将 `v6-experience/dist/` 目录部署至任意静态托管服务（Nginx、Vercel、Cloudflare Pages、GitHub Pages 等）即可独立运行。所有图片、SVG 与中文字体子集均为本地静态资源，无外部 CDN 依赖。

## 文档索引

- [设计系统说明](docs/DESIGN_SYSTEM.md)
- [设计素材映射清单](docs/ASSET_MAP.md)
- [V6.1 双分辨率验收、许可证与改动清单](docs/V6.1-验收.md)
- [已知边界与演示限制](docs/KNOWN_LIMITS.md)
- [双分辨率 Chromium 运行截图及录屏](docs/screenshots/)
