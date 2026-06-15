# Holiday Calendar — 设计规格书

> 状态：已确认  
> 日期：2026-06-16  
> 参考站：holidays-calendar.net

---

## 一、项目概述

做一个公共假期日历站，参考 holidays-calendar.net 的轻量级静态内容站模式，但在功能层面做差异化——提供 iCal 日历订阅和精美打印 PDF 两个核心工具功能。先中文后英文，MVP 覆盖中国、美国、德国三个国家。纯静态架构，零服务器成本起步，后期通过广告和联盟营销变现。

---

## 二、技术架构

| 层 | 选型 | 说明 |
|---|------|------|
| 框架 | Astro | 静态站点生成器，默认零 JS |
| 样式 | Tailwind CSS | 快速开发，打印样式友好 |
| 数据 | YAML 文件 | 每个国家/年份一个文件，手动维护 |
| iCal | 构建时生成 .ics | 静态文件，下载导入 |
| PDF/打印 | CSS @page + window.print() | 浏览器原生，无外部依赖 |
| 托管 | Cloudflare Pages | 免费、全球 CDN、GitHub 自动部署 |
| 分析 | Google Analytics | 了解流量，为广告变现做准备 |

### 项目结构

```
holiday-calendar/
├── src/
│   ├── pages/
│   │   ├── index.astro              # 首页：国家选择 + 当前年份预览
│   │   ├── [country]/index.astro    # 国家页：默认今年日历
│   │   ├── [country]/[year].astro   # 指定年份日历
│   │   ├── print/
│   │   │   └── [country]/[year].astro  # 打印优化页
│   │   ├── subscribe.astro          # 订阅指南
│   │   └── about.astro              # 关于本站
│   ├── components/
│   │   ├── Calendar.astro           # 日历网格（12个月）
│   │   ├── MonthGrid.astro          # 单个月份网格
│   │   ├── HolidayList.astro        # 假期列表/表格
│   │   ├── CountryPicker.astro      # 国家选择器
│   │   └── YearTabs.astro           # 年份切换标签
│   ├── data/
│   │   ├── cn/2026.yaml             # 中国假期数据
│   │   ├── us/2026.yaml             # 美国假期数据
│   │   └── de/2026.yaml             # 德国假期数据
│   ├── utils/
│   │   ├── ical.ts                  # 生成 .ics 文件
│   │   ├── calendar.ts              # 日历计算工具
│   │   └── holidays.ts              # YAML 数据加载
│   └── layouts/
│       └── BaseLayout.astro         # 全局布局（含 header/footer）
├── public/
│   └── ics/                         # 构建时生成，如 cn-2026.ics
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

### 页面路由

| 路由 | 内容 |
|------|------|
| `/` | 首页，国家卡片网格 |
| `/cn/` | 中国今年假期日历 |
| `/cn/2027/` | 中国 2027 假期日历 |
| `/us/` | 美国今年假期日历 |
| `/de/` | 德国今年假期日历 |
| `/print/cn/2026/` | 中国 2026 打印优化页 |
| `/subscribe/` | iCal 订阅使用指南 |
| `/about/` | 关于本站、数据来源 |

---

## 三、数据模型

假期数据用 YAML 格式存储，每个国家每年一个文件。

### 字段定义

```yaml
country: cn              # ISO 国家代码
year: 2026               # 年份
timezone: Asia/Shanghai  # 时区
holidays:
  - name: 元旦           # 中文名称
    name_en: New Year's Day  # 英文名称
    date: 2026-01-01     # 日期 (YYYY-MM-DD)
    type: public         # public | observance | traditional
    days_off: 1          # 放假天数（可选）
    notes: "1月1日放假"  # 备注（可选）
workdays:                # 调休上班日（中国特色）
  - date: 2026-02-14
    notes: "春节调休"
```

### 假期类型

| type | 含义 | 显示色 |
|------|------|--------|
| `public` | 法定公休日，全国放假 | 红色 |
| `observance` | 庆祝但非公休（如万圣节） | 橙色 |
| `traditional` | 传统节日（如春节、中秋） | 金色 |

### 数据维护流程

1. 用 `python-holidays` 开源库生成初始数据
2. 对照各国政府官网人工校对
3. 每年发布新数据时重复此流程
4. YAML 数据文件提交到 Git 仓库

---

## 四、iCal 订阅功能

### 实现方式

构建时遍历所有国家/年份的 YAML 数据，为每个组合生成一个 `.ics` 静态文件，输出到 `public/ics/` 目录。用户下载后导入日历应用。

### .ics 文件格式

```icalendar
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HolidayCalendar//CN
X-WR-CALNAME:2026年中国假期
X-WR-CALDESC:中国2026年法定节假日
REFRESH-INTERVAL;VALUE=DURATION:P1W
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260101
DTEND;VALUE=DATE:20260102
SUMMARY:元旦
TRANSP:TRANSPARENT
BEGIN:VALARM
TRIGGER:-PT15H
ACTION:DISPLAY
DESCRIPTION:明天是元旦假期！
END:VALARM
END:VEVENT
END:VCALENDAR
```

### 设计决策

- **格式**：标准 iCalendar 2.0，iOS/Android/Google Calendar 原生支持
- **提醒**：每个事件附带提前 15 小时通知
- **订阅形式**：首版为下载导入（静态 .ics 文件）；后期可升级为动态订阅（webcal:// 协议）
- **文件命名**：`{country}-{year}.ics`（如 `cn-2026.ics`）

### 用户体验流程

国家日历页 → 点击「导入日历」按钮 → 下载 .ics 文件 → 系统自动打开日历 → 用户确认导入

---

## 五、打印优化功能

### 实现方式

独立的 `/print/[country]/[year]/` 路由，使用 `@media print` 和 CSS `@page` 规则优化打印效果。用户点击「打印」按钮后打开此页面并触发 `window.print()`。

### 打印样式规则

- `@page { size: A4 portrait; margin: 10mm }`
- 假期格：红色/橙色背景 + 粗体
- 调休上班日：灰色标记
- 隐藏导航栏、按钮等交互元素
- 页脚：网站名 + URL
- 彩色/灰度两种模式

### 用户可调选项

| 选项 | 值 |
|------|-----|
| 视图 | 6个月 / 12个月 |
| 颜色 | 彩色 / 灰度（黑白打印友好） |
| 字体 | 标准 / 大号（老年友好） |
| 备注区 | 开启 / 关闭（右侧留白） |

---

## 六、页面设计

### 首页（/）

- 风格：简洁卡片式（方案 A）
- 布局：Logo 顶栏 → 标题「2026年各国假期日历」→ 国家卡片网格（国旗 + 名称 + 假期数量） → 底部提示「更多国家即将上线」
- MVP 卡片：中国、美国、德国（3 张）
- 占位：一个虚线「更多国家」占位卡片

### 国家日历页（/[country]/）

- 风格：大日历优先式（方案 B）
- 布局：顶栏 → 国家名 + 年份 + 假期统计 → 操作按钮（导入日历 / 打印）→ 年份切换标签 → 12 个月日历网格（3 列）→ 可展开的假期列表 → 数据来源说明
- 每月网格显示该月的假期标签

### 公共元素

- **顶栏**：Logo + 国家切换下拉 + 语言切换（后期）
- **底部**：版权 © → 数据来源 → 反馈邮箱 → 隐私政策
- **SEO meta**：每页独立的 title / description / canonical / Structured Data (Event schema)

---

## 七、变现策略

### 广告位预留（MVP 阶段不启用）

| 位置 | 类型 | 尺寸 |
|------|------|------|
| 首页底部 | 横幅 | 728×90 |
| 日历页侧边 | 摩天大楼 | 160×600 |
| 假期列表中间 | 原生广告块 | 内容嵌入 |
| 打印页 | 不放广告 | — |

### 分期变现路径

1. **第 0 阶段（现在）**：无广告，纯内容积累 SEO 权重
2. **第 1 阶段（日均 100+ UV）**：Google AdSense 自动广告
3. **第 2 阶段（日均 1000+ UV）**：手动优化广告位 + 联盟营销（旅行保险、签证服务、机票酒店）
4. **第 3 阶段（日均 5000+ UV）**：直接联系广告主（航空公司、OTA 平台）

---

## 八、托管与域名

### 域名策略

- **MVP**：Cloudflare Pages 默认域名 `holiday-calendar.pages.dev`
- **成长后**：购买自定义域名（如 `holiday-calendar.com`）
- DNS + CDN 统一在 Cloudflare 管理

### 部署流程

1. GitHub 仓库：`holiday-calendar`
2. 连接 Cloudflare Pages，监听 main 分支
3. 每次 push 自动构建部署
4. 构建命令：`npm run build`
5. 输出目录：`dist/`

---

## 九、MVP 交付标准

### 功能清单

- [ ] 首页：3 个国家卡片
- [ ] 3 个国家 × 当前年份日历页（默认 2026）
- [ ] 12 个月日历网格渲染
- [ ] 假期列表（可展开）
- [ ] 年份切换（2025 / 2026 / 2027，通过 python-holidays 批量生成三年数据）
- [ ] iCal 文件下载（构建时生成）
- [ ] 打印优化页 + 打印按钮
- [ ] 响应式设计（桌面 + 移动端）
- [ ] Google Analytics 集成
- [ ] 关于页 + 数据来源页

### MVP 明确不包含

- 动态 iCal 订阅（webcal://）
- 多语言切换 UI
- 假期倒计时 / 日期计算器
- 用户账户 / 偏好记忆
- 广告代码
- 服务端渲染 / API

### 验收标准

- 所有页面在桌面端和移动端正常显示
- .ics 文件可被 iOS 日历、Google Calendar 成功导入
- 打印页在 Chrome/Firefox 中打印效果正确（A4 竖版）
- 页面 Lighthouse 性能评分 ≥ 90
- Cloudflare Pages 成功部署并可访问

---

## 十、错误处理与边界情况

- **无假期数据**：显示「暂无数据」占位，不渲染空列表
- **无效年份**：重定向到该国家有效年份范围
- **无效国家路由**：重定向到 404 页
- **.ics 文件不存在**：返回 404，路径由国家+年份组成
- **打印 JS 被禁用**：显示手动操作提示「请按 Ctrl+P 打印」
- **移动端打印**：提示用系统分享菜单保存为 PDF

---

## 十一、测试策略

| 测试类型 | 内容 |
|------|------|
| 构建测试 | `astro build` 成功，所有页面生成 |
| 数据测试 | YAML 文件格式校验，日期有效性检查 |
| iCal 测试 | 生成的 .ics 文件能用日历应用打开 |
| 打印测试 | Chrome/Firefox 打印预览截图验证 |
| 响应式测试 | 375px / 768px / 1280px 三个断点 |
| 链接测试 | 所有内部链接不 404 |
