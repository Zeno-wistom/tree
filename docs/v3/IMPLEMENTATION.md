# 校园来信 V3 实施记录

## 基线与边界
- V1 本地/远端稳定提交 d1ad6e16b8f5957042ee8a4a0901566f97effe3f，远端 codex/campus-postcard。V2 与邮局实验此前未独立提交；本轮保留其文件及入口，不删除已有用户暂存的“对比评审”副本。
- 独立分支 codex/v3-envelope；新入口 /?v3，V1 /，V2 /?direction=a，微缩邮局 /?postoffice。
- 共享 events/postcards/sessionConfig，eventId 与 postcardId 双条件关联，无持久化。

## 阶段记录
1. 盘点、来源与架构：完成。DOM 纸袋/封盖/封条/扇形信封/信纸/双面明信片/收藏套；显式阶段与同步锁；动画由 useGSAP 管理。
2. 首页：运行并检查 1920×1080 截图，修正纸面层级。开场 release/unfold/stage 三个标签；约2.5秒；可跳过；减弱动态效果为0.1秒。
3. 阵列：最多6项、三校筛选、群体退让、quickTo 倾斜、触摸首点聚焦与二次点打开；修复 focus 导致首点提前打开的问题。
4. 详情/明信片/收尾：接通；五状态截图已保存；详情退后与明信片抽出，封盖/标题作为同一层运动。
5. 独立只读审查：发现并修复返回视觉焦点未还原、inert 解除前抢先 focus 的问题；Edge 1366×768 触摸复核通过。正式测试结果见后续验收记录。

## 文化来源与命名
- https://www.gcs.gov.mo/news/detail/zh-hans/N23Jdwu8co?category=%E6%97%85%E9%81%8A%E6%96%87%E5%8C%96 ：文化局公开介绍葡萄牙瓷砖画制作工艺。
- https://macaoideas.ipim.gov.mo/product/120 ：澳门特色瓷砖艺术介绍。
- 原创瓷砖、植物、莲花与海风纹样，未复制外部作品；不表示真实广场铺装或建筑。
- 对“德志/德智/德致”和“澳琴国际教育大学城”组合检索未找到可靠官方名称确认，界面暂用“大学城”，名称待权属方核实。未把搜索无结果当作不存在的证据。
- 字体为用户系统提供的 Microsoft YaHei / PingFang SC，不分发字体文件。

## Skills 实际使用
- Oil UI：读取主流程，用于主角/动作统一、真实画面验证与独立审查；不重新探索，不用 AI 生图。版本检查无更新输出。
- gsap-react / gsap-timeline：沿用已读取规则；scope、contextSafe、revertOnUpdate 与 master timeline。
- gsap-performance：本轮读取，transform/opacity 与 quickTo；视口由 ResizeObserver 独立处理。
- animate / review-animations：本轮读取，区分首次开场与高频反馈、减弱模式、打断和清理。用户指定的叙事开场超过300ms，高频反馈为230ms。
- Vibe-Upgrader：沿用 standard / implementation 与 diagnosis，审查层级、输入、状态与回归，无外部组件或外部参考调用。
- 未新增运行依赖，V3 不调用 Three.js。历史邮局依赖保留并懒加载。

## 时间轴与状态
IDLE→OPENING→DISCOVER→DETAIL→POSTCARD→COMPLETE。phase 表示内容状态，locked ref 同步锁定重入，busy 控制 inert。useGSAP 按阶段清理并重建主动画；动画结束解除锁后 useLayoutEffect 恢复焦点。reset 可打断动画并清空会话。过滤先收回旧信封再替换数据；分页最多六项。风先掠过，叶片被带动，封条抬起并回落，每段之间留有停顿。

返回发现保留学校与选择；翻面保持按钮焦点。原生 dialog 管理超时确认的模态焦点与键盘循环，90秒无操作提示、15秒后重置。刷新为初始待机。

## 验收结果
- npm run build 通过。V3 自身分包约21KB（gzip约7KB），没有加载 Three.js。构建体积提示来自保留的邮局实验分包。
- npm test：28/28 通过，包含 V1 14 项 + V3 14 项（1920/1366 两个横屏规格）。
- 新增覆盖：完整五阶段、三校筛选、保留筛选与焦点、触摸首点/二点、键盘翻面、快速开封/跳过/中断重置、90+15秒超时、空活动/缺失明信片、六组一一匹配、超过六封时分页。
- 独立审查发现的焦点与邻卡退让问题已修复并由审查者在 Edge 1366 触摸环境复核。
- 自动操作录屏与 runtime.json：无页面错误/警告；rAF 间隔为录屏环境采样，不能用作真实触摸屏帧率承诺。
- 五状态最终截图、翻面背面、聚焦与开场中间帧位于本目录；index.html 可统一浏览。

## 尚未核验与限制
- 正式广场名称待权属方提供依据；未宣称真实广场布局或建筑。
- 尚未在实体公共触摸屏、Safari/Firefox、不同GPU与200%缩放环境验证。当前按1920×1080与1366×768横屏优化，手机竖屏不是本轮验收规格。
- 本轮是本机原型与自动化浏览器验证，尚未得到用户的主观视觉验收。
- 旧版用户暂存的“对比评审”目录与其他过程文件未纳入本轮提交，也未删除或重排。
