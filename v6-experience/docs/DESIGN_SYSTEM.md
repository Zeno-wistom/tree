# 《拾花一叶》V6 设计系统说明

## 视觉定位

**Modern Botanical Editorial × Macau Tile Art × Interactive Paper Experience**

从三校 A6 与四季海报原稿提炼统一的纸本印刷与澳门花砖视觉语言，摒弃普通 SaaS 卡片墙与过度渐变阴影，面向 `1920×1080` 与 `1366×768` 横屏公共触摸屏（逻辑舞台 `1440×810` 等比缩放）。

## 色彩令牌（`src/styles/tokens.css`）

| 类别 | 令牌 | 色值 | 用途 |
| --- | --- | --- | --- |
| 纸面基底 | `--v6-canvas` / `--v6-paper` | `#EFECE0` / `#FAF5E8` | 全局棉纸画布、明信片与信纸底色 |
| 植物草青 | `--v6-sage` / `--v6-sage-line` | `#E2E6D4` / `#B5BA9E` | 信封内衬、细描边与次级纸层 |
| 主墨色 | `--v6-ink` / `--v6-muted` | `#1F4B4A` / `#5E6B5E` | 松石深青主字色、辅助说明文字 |
| 澳门大学 | `--v6-um-red` / `--v6-um-wheat` | `#D94A2B` / `#EFE5A8` | 木棉花主题点缀、收藏章与重点行动按钮 |
| 澳门理工大学 | `--v6-mpu-orange` / `--v6-mpu-blue` | `#E88224` / `#204386` | 炮仗花点缀、时光邮局路由识别色 |
| 澳门旅游大学 | `--v6-utm-pink` / `--v6-utm-plum` | `#D87D90` / `#5A394D` | 桃花主题点缀 |
| 硬件独立灯光 | `--v6-light-branch` / `--v6-light-tray` / `--v6-light-alert` | `#E6B43E` / `#2C8C6C` / `#C64538` | 枝端暖金预告灯、侧盘翠绿取卡灯（独立于四季树灯）、异常陶红提示 |

## 排版与字体子集

- **中文标题**：本地子集化 `Noto Serif CJK SC`（`public/fonts/noto-serif-sc-v6.woff2`，覆盖 V6 全量 774 个不重复字符，体积 215 KB），零缺字、零外部网络依赖。
- **正文与控件**：无衬线中文栈（`Noto Sans CJK SC` / `PingFang SC` / `Microsoft YaHei UI`），主要按钮触控高度 ≥ 48px。

## 装饰与动效原则

- **澳门花砖转译**：`MacauTileBorder`（卷草与方形花砖带）与 `MacauTileDiamond`（四瓣菱形瓷砖）直接提炼自原稿底边与角纹，克制用于信封底边、收藏套顶边、专用封袋与回执。
- **GSAP 纸品动效**：完整继承 V5 7 段核心动画（待机阵风、同 DOM 拆信下沉、扇形抽卡、信纸展开、A6 3D 翻面、实色收藏套盖章、完整逆向复位），并新增路线 C 叶形卡空气阻力重力飘落与路线 D 专用封袋装袋盖章仪式；全部支持 `prefers-reduced-motion` 与页面失焦自动暂停。
