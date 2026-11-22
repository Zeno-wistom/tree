# 《拾花一叶》V6.2 · 德智广场互动树

V6.2 在独立工作树的 `codex/v6.2-experience` 分支开发，起点为 `codex/v6.1-experience` 的 `ef78274`。轻触树下信封的叶封，从同一只信封抽出三校明信片。秋千、四季领卡与时光邮局都可从树下进入。

## 快速开始

```bash
cd v6-experience
npm ci
npm run dev
```

- 默认开发地址：`http://127.0.0.1:5199/`
- 普通访客模式：`http://127.0.0.1:5199/`（隐藏演示控制面板，呈现纯净公共触屏界面）
- **课程评审演示模式**：`http://127.0.0.1:5199/?demo=1`（进入 B/C/D 后，右下角的「演示控制台」仅显示当前路线相关的情境。C 的模拟触发与工作人员复位在页面底部的「C 演示工具」）
- 时令参数：`?season=spring|summer|autumn|winter` 设置本期叶卡。
- 超时测试参数：`?idle=1000` 可缩短 90 秒无操作触发阈值以便快速验证。

## 构建与测试

```bash
# 生产构建（含 TypeScript 严格校验）
npm run build

# 本地预览生产包
npm run preview

# 单元测试（数据与素材映射完整性）
npm test

# 端到端回归与四种横屏视口检查
npx playwright install chromium
npm run test:e2e
```

## 独立部署

运行 `npm run build` 后将 `v6-experience/dist/` 目录部署至任意静态托管服务（Nginx、Vercel、Cloudflare Pages、GitHub Pages 等）即可独立运行。所有图片、SVG 与中文字体子集均为本地静态资源，无外部 CDN 依赖。

## 文档索引

- [V6.2 横屏验收、浏览器截图、录屏及修改清单](docs/V6.2-全屏与纸品验收.md)
- [基线版本的双分辨率验收](docs/活态纸本体验验收.md)
- [设计系统说明](docs/DESIGN_SYSTEM.md)
- [设计素材映射清单](docs/ASSET_MAP.md)
- [V6.1 双分辨率验收、许可证与改动清单](docs/V6.1-验收.md)
- [已知边界与演示限制](docs/KNOWN_LIMITS.md)
- [双分辨率 Chromium 运行截图及录屏](docs/screenshots/)
