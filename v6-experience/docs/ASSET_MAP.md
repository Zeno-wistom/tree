# 《拾花一叶》V6 设计素材映射清单

所有网页明信片资产均从原仓库 `新素材/` 的 Adobe Illustrator 源文件无损导出并做网页体积优化，严格保留原稿学校名称、花卉品种与文字，未作任何篡改。

| 源文件 | 画板与正反映射 | 导出路径（`public/assets/postcards/`） | V6 归属路线 | 特别说明 |
| --- | --- | --- | --- | --- |
| `三校明信片(矩形）A6正反面.ai` | P1 正 / P2 背：澳门大学 · 木棉花<br>P3 正 / P4 背：澳门理工大学 · 炮仗花<br>P5 正 / P6 背：澳门旅游大学 · 桃花 | `schools/um-{front,back}.webp`<br>`schools/upm-{front,back}.webp`<br>`schools/utm-{front,back}.webp` | **路线 A**（屏幕探索）<br>**路线 D**（时光邮局） | 画面保留原稿 `UM/UPM/UTM`；网页筛选标签统一使用中文校名避免缩写混淆 |
| `异形 三角梅四季.ai` | P1 正 / P2 背：春 · 绿樱<br>**P4 正 / P3 背**：夏 · 同安红<br>P5 正 / P6 背：秋 · 加州黄金<br>P7 正 / P8 背：冬 · 漳红樱 | `leaf/spring-{front,back}.png`<br>`leaf/summer-{front,back}.png`<br>`leaf/autumn-{front,back}.png`<br>`leaf/winter-{front,back}.png` | **HOME**（枝端悬叶）<br>**路线 C**（实体飘落叶形卡） | 已做外缘透明镂空并紧裁切；**已人工修正夏季 P3=背面、P4=正面 的倒序画板** |
| `海报式-四季.ai` | P5 正 / P1 背：春 · 绿樱<br>P6 正 / P2 背：夏 · 同安红<br>P7 正 / P3 背：秋 · 加州黄金<br>P8 正 / P4 背：冬 · 漳红樱 | `seasons/spring-{front,back}.webp`<br>`seasons/summer-{front,back}.webp`<br>`seasons/autumn-{front,back}.webp`<br>`seasons/winter-{front,back}.webp` | **路线 D**（时光邮局四季限定款） | 与三校 A6 共享邮票框、书写线、收件人/地址栏及底部澳门花砖带 |
| `花器款-四季.ai` | P5–P8 正 / P1–P4 背（春/夏/秋/冬） | 未合入主流程 | **备选方案保留** | 与海报式/三校 A6 构图及尺寸体系不同，按要求不混排 |
