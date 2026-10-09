---
name: 熊野古道 41 章
description: 山地地图的页边注记与清楚可查的徒步指南
colors:
  ink: "#173d34"
  muted: "#576a63"
  paper: "#fff"
  line: "#dce4de"
  red: "#b23e32"
  blue: "#216ed1"
  pale: "#f1f5f1"
  stamp: "#302f2a"
  ink-hover: "#285a49"
  route: "#514334"
  boat: "#527b86"
typography:
  display:
    fontFamily: '"Songti SC","Noto Serif CJK SC",serif'
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: ".025em"
  brand:
    fontFamily: '"Songti SC","Noto Serif CJK SC",serif'
    fontSize: "26px"
    fontWeight: 700
    letterSpacing: ".06em"
  body:
    fontFamily: '-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif'
    fontSize: "16px"
  guide-body:
    fontSize: "15px"
    lineHeight: 1.85
  guide-subheading:
    fontSize: "17px"
    lineHeight: 1.5
  label:
    fontSize: "13px"
rounded:
  stamp: "2px"
  control: "5px"
  map-control: "6px"
spacing:
  compact: "8px"
  row: "12px"
  group: "16px"
  section: "24px"
components:
  guide-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "9px 20px"
  guide-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  map-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.map-control}"
    padding: "11px 16px"
  guide-stamp-number:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.paper}"
    rounded: "{rounded.stamp}"
    width: "27px"
    height: "27px"
---

# Design System: 熊野古道 41 章

## Overview

**Creative North Star: "山地地图的页边注记"**

山地地图的页边注记：地图占主画面，白色信息栏与深墨绿文字保证户外可读。攻略把同一套纸张、墨色和章号语言延伸为清楚可查的徒步指南；真实地图本身是主要视觉，不添加风景装饰。

保留既有地图的操作密度与真实地理关系。攻略侧重连续阅读、分段查询，再跳入地图；两种表面共享身份、颜色与章号，不要求使用相同版式。

**Key Characteristics:**
- 白纸与深墨绿形成主要阅读对比。
- 宋体用于品牌与攻略开篇标题，系统中文字体承担长文和操作信息。
- 章号、来源与精度是信息，不是装饰。

## Colors

白纸、深墨绿和低饱和浅绿承担大部分界面，朱红与鲜蓝承担明确状态。

### Primary
- **深墨绿（ink）**：正文、链接、定位按钮和攻略主入口；悬停使用 ink-hover。
- **朱红（red）**：品牌印章、当前主导航、选中章点和章链接悬停。

### Secondary
- **鲜蓝（blue）**：自己的 GPS 位置与键盘焦点。
- **步道棕（route）**与**舟运蓝灰（boat）**：分别配实线与虚线，颜色和线型共同表达路线类别。

### Neutral
- **白纸（paper）**：页面及地图浮层背景。
- **次要墨色（muted）**：来源、元数据与辅助说明。
- **浅绿（pale）**：列表悬停、位置详情、核对提醒与返回入口。
- **分隔线（line）**：分节与行边界；**章号黑（stamp）**：白号方块。

**The Status Before Decoration Rule.** 朱红与鲜蓝优先表达选中、位置和焦点，不扩展为大面积装饰。

## Typography

**Display Font:** Songti SC，回退 Noto Serif CJK SC 与 serif。
**Body Font:** 系统中文无衬线字体栈，见 frontmatter。

宋体给品牌和攻略开篇提供书页感；其余标题沿用系统正文，避免把每个小标题都变成展示标题。章号、距离和日程数字使用等宽数字。

### Hierarchy
- 攻略开篇标题在桌面为 38px，980px 以下为 32px，760px 以下为 29px，360px 以下为 26px；移动行高为 1.5。
- 品牌标题移动端为 22px；攻略章节标题为 23px，移动端为 20px。
- 每日摘要标题为 20px，移动端为 17px，最窄断点为 16px；每日内部小标题使用 guide-subheading。
- 攻略段落使用 guide-body，导语为 17px（移动端 16px）；地图的正文、标签和来源依信息密度采用 12–16px。
- 长文段落通常限制为 72ch；每日详情最大宽度为 790px。

## Layout

地图桌面保留固定视窗工作区：标题栏 88px，下方为 368px 信息栏与剩余宽度地图；1600px 以上信息栏为 400px。760px 以下标题栏为 74px，地图在上方吸顶（52dvh，最小 310px、最大 560px），点位在下方随页面滚动。

攻略为可滚动文档，容器最大 1160px，桌面左右留白 40px，760px 以下 20px，360px 以下 16px。桌面开篇正文与条件说明分栏，移动端顺序堆叠。总览桌面采用日期、路线、步时、住宿四列；980px 以下住宿换行，760px 以下成为日期与内容两列。实用说明两列在移动端改为单列。

沿用 compact、row、group、section 的常用间距，分节以留白和细线组织，不嵌套卡片。攻略的逐日选择条吸顶，并为日期锚点留出滚动间距。

## Elevation & Depth

攻略使用平面纸张、细线与浅色提醒。地图保留白色浮层的轻阴影，使操作与真实地图区分：标签及路线开关为 `0 2px 12px #173d3412`，地图按钮及消息为 `0 2px 12px #173d3420`，定位按钮为 `0 3px 14px #173d3430`。这些浮层阴影不推广到长文段落。

## Shapes

章号保留近方形的小圆角；普通控制采用紧凑圆角，不改成胶囊按钮。地图设施标记、位置圆点和章号方块分别保留自身形状。攻略每日展开箭头由边框绘制，不新增装饰图标。

## Components

### Buttons and Navigation

地图定位保持墨绿白字及地图内可见位置；地图其他浮层按钮保持白底。攻略主入口为墨绿白字，最小高度 46px。主导航以朱红文字和底部细线标识当前页，悬停为浅绿底。按钮、链接及摘要的键盘焦点采用 3px 鲜蓝描边，外移 3px。

在用户允许动态效果时，地图按钮背景与文字、章点缩放使用 0.15s 过渡。不要为攻略展开添加额外动画。

### Stamp and Route Rows

列表行不用卡片嵌套。章号采用官方押印图的黑底白号方块；地图选中章点变朱红并放大。攻略章链接沿用同样号码，悬停时方块变朱红，名称加下划线。

路线以独立原始地理线段绘制，保留官方图的主支关系；不把官方示意图像素位置当成经纬度。路线开关和分段来源可见，GPS 与设施保持在路线之上。

### Guide Reading Controls

总览每行是原生日期链接。逐日内容使用原生 details / summary，Day 0 初始展开，摘要包含日期、路线、距离与时间；长日另有文字提示。吸顶的原生选择框辅助定位日期，不替代总览链接。次级来源也使用原生折叠区域。

### Notes and Detail Surfaces

位置详情用浅绿背景，并将来源与精度放在详情附近。攻略出发核对提示沿用浅绿平面底色；住宿候选、时间安排和资料链接通过列表及细线组织。地图跳转保留当天上下文，以便返回原日。

## Do's and Don'ts

### Do:
- **Do** 保留官方押印图的黑底白号方块，朱红标记当前选中章点。
- **Do** 让来源与精度紧邻位置详情，路线开关和分段来源可见。
- **Do** 保留地图上方、点位下方的移动布局，定位按钮始终在地图里可见。
- **Do** 主要操作目标至少 44px；列表采用分隔行，不用卡片嵌套。
- **Do** 以已有原生链接、选择框和 details 承担攻略跳转与展开。

### Don't:
- **Don't** 不添加风景装饰或用装饰图片替代真实地图。
- **Don't** 不虚构路线连线，不把官方示意图像素位置当成经纬度。
- **Don't** 不将攻略长文套进地图的固定视窗布局。

实现依据：`dist/style.css`、`dist/guide.css`、`build-guide.mjs` 与 `dist/map.html`。本次合并保留既有地图决策，只补充已实现的攻略阅读规则。
