# 原型验收 · 2026-11-01

## 结果
- `npm run build`：TypeScript 与 Vite 生产构建通过。
- `npm test`：14 / 14 项通过，独立 Microsoft Edge 浏览器，Playwright 自动操作。
- 1920×1080、1366×768 各7项；每组包括390×844辅助窄屏流程。
- 完整流程未捕获浏览器 console error 或 pageerror。
- npm 安装审计：0 vulnerabilities（安装当次结果）。

## 实际验证范围
| 验证 | 结果 |
| --- | --- |
| P0 → P1 → P2 → P3 → P4 → 清空 | 通过 |
| 三校筛选与活动数量 | 每校2条，通过 |
| 返回保留筛选、点击时列表滚动位置 | 通过 |
| 六个活动各自正面、背面及确认结果 | 全部对应 |
| 无活动状态、无匹配明信片不能确认 | 通过，使用测试拦截注入空数据，不增加产品测试按钮 |
| 90秒提示、15秒重置、继续保留当前页 | 浏览器虚拟时钟验证通过 |
| 刷新清空会话 | 通过 |
| Enter翻面、标题焦点、弹窗Tab循环/Escape恢复 | 通过 |
| prefers-reduced-motion | 翻面过渡关闭，通过 |
| 两个横屏尺寸五页无外层滚动溢出 | 通过 |
| 明信片翻面提示不与确认栏重叠 | 实际元素边界断言通过 |
| 390px窄屏可完成选择且无横向滚动 | 通过 |

## 视觉检查与修正
实际打开浏览器截图检查首页、活动列表、详情、明信片正反面、完成页及辅助窄屏。采用原创 SVG 插画与统一纸张语言。已修复1366×768下翻面提示侵入确认栏、背面附加签名拥挤、1920首页辅助刊头遮挡；补充对应布局断言。功能测试通过不代表用户已主观认可视觉。

## 实际截图
| 页面/状态 | 1920×1080 | 1366×768 |
| --- | --- | --- |
| 待机首页 | [P0](screenshots/1920-P0-home.png) | [P0](screenshots/1366-P0-home.png) |
| 活动发现 | [P1](screenshots/1920-P1-discover.png) | [P1](screenshots/1366-P1-discover.png) |
| 活动详情 | [P2](screenshots/1920-P2-detail.png) | [P2](screenshots/1366-P2-detail.png) |
| 明信片正面 | [P3正面](screenshots/1920-P3-front.png) | [P3正面](screenshots/1366-P3-front.png) |
| 明信片背面 | [P3背面](screenshots/1920-P3-back.png) | [P3背面](screenshots/1366-P3-back.png) |
| 选择完成 | [P4](screenshots/1920-P4-complete.png) | [P4](screenshots/1366-P4-complete.png) |
| 超时提醒 | [倒计时](screenshots/1920-timeout.png) | [倒计时](screenshots/1366-timeout.png) |
| 无活动 | [空状态](screenshots/1920-empty.png) | [空状态](screenshots/1366-empty.png) |
| 无明信片 | [异常状态](screenshots/1920-missing-postcard.png) | [异常状态](screenshots/1366-missing-postcard.png) |

机器结果保留在 test-results.json；原始测试在 tests/experience.spec.ts，可重复运行。

## 未验证/已知边界
- 未进行真实触摸屏、现场观看距离、连续多小时运行或真实访客试用。
- 未验证 Safari / Firefox；窄屏为辅助能力，主要目标仍为横屏公共触摸屏。
- 超时测试采用浏览器虚拟时钟，不声称已完成真实长时间待机实测。
- 活动、时间、地点、明信片与节日均为可替换演示内容；没有官方授权资产或正式活动数据。
- 当前明信片正面使用插画key，接入真实图片需替换渲染并重新检验裁切；最终主题需要同步数据与样式。
- 当前选择仅在内存存在，不是账户收藏，不长期保存或传送；无实体投递、硬件、后台与支付。
- 未外部发布。体验地址仅为当前电脑本地服务：http://127.0.0.1:5173/ 。
