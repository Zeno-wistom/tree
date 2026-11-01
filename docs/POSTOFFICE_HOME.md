# 微缩校园邮局首页 · 实施与验收

2026-11-02。分支 `codex/micro-post-office`。入口 `/?postoffice`，V1 `/`；开始探索进入 `/?explore=1` 的既有活动列表。其余四页组件与数据未重写。

## 视觉与实现

React + HTML/CSS 界面，Three.js 实时渲染。原创程序化模型，无 AI 生图和外部 3D 模型：贝塞尔拱形挤出外壳、圆角门板、黄铜铰链/螺钉/拉手、厚纸信封/折痕/蜡封、旋转成型陶盆、曲面叶片、木底座与校园告示牌。Canvas 生成纸/木微纹理与中文标牌。材质通过 roughness、clearcoat 与金属度区分，室内环境反射与方向光阴影建立空间层次。场景静止时不持续渲染，交互期间开启渲染，结束后停止。Three.js 动态加载，避免 V1 首屏加载其完整体积。

GSAP Timeline：按键反馈 → 门板以底部铰链为轴开启 → 信封从内部移出。再次点击收回并关门。动画中防止重复触发；支持 reduced-motion；useGSAP + scope/contextSafe，卸载时清理动画、WebGL 几何/材质/纹理、观察器。

实际读取并应用项目已安装 `gsap-react` 与 `gsap-timeline`。新增依赖 three、开发类型 @types/three；无全局配置修改。未声称本轮使用 Oil UI 或独立艺术评审。

## 参考来源

- La Rosée：https://herve.paris/our-work/la-rosee — 公开说明的柔和色彩、实体模型与纸材感。
- Keskidi：https://www.naelmessaoudene.com/works/keskidi — Three.js/GSAP 的空间内容交互方法；本轮转译为单一开箱动作。
- Animal Futures：https://mesh3d.gallery/website/animal-futures — 微缩世界的层次参考；未复制资源或完整机制。
- Three.js 官方文档：https://threejs.org/docs/ — 几何、材质和渲染 API。

## 验证与范围

真实 Edge 1920×1080 截图：postoffice-home.png / postoffice-open.png；录屏 postoffice-demo.webm。自动检查两次完整开合与开始探索接入 V1；1366 与 390 宽度下 reduced-motion 与横向溢出检查。结果见 postoffice-checks.json。构建与 V1 测试另以实际命令结果交付。

待用户视觉验收。未执行实体触摸屏/GPU 帧率基准验证；浏览器软件渲染截图不能代表目标硬件性能。首页右侧的代表性交互由 HTML 按钮触发，3D 画面本身无拾取操作。

最终验证：npm run build 通过（Three.js 独立块存在体积提示）；V1 npm test 14/14 通过。新首页浏览器无 pageerror，重复开合两次、探索入口和三档尺寸检查通过。未推送、未合并。
