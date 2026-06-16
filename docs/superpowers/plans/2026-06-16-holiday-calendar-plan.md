# Holiday Calendar 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public holiday calendar site with iCal download and print-optimized views for China, USA, and Germany, deployed on Cloudflare Pages.

**Architecture:** Astro static site with JSON data files. Build-time iCal generation via Astro endpoints. Print-optimized pages use CSS @page rules. Zero client-side framework — all interactivity (year switching, print, iCal download) uses standard HTML links and forms.

**Tech Stack:** Astro 5, Tailwind CSS 4, TypeScript, JSON data files, Cloudflare Pages

---

## 文件结构

```
holiday-calendar/
├── src/
│   ├── pages/
│   │   ├── index.astro                  # 首页，国家卡片网格
│   │   ├── [country]/
│   │   │   ├── index.astro              # 国家页重定向到今年
│   │   │   └── [year].astro             # 指定年份日历
│   │   ├── print/
│   │   │   └── [country]/
│   │   │       └── [year].astro         # 打印优化页
│   │   ├── ics/
│   │   │   └── [country]-[year].ics.ts  # iCal 静态文件端点
│   │   ├── 404.astro                    # 404 页面
│   │   ├── subscribe.astro              # 订阅指南
│   │   └── about.astro                  # 关于本站
│   ├── components/
│   │   ├── BaseLayout.astro             # 全局布局
│   │   ├── Calendar.astro               # 12个月日历容器
│   │   ├── MonthGrid.astro              # 单月网格
│   │   ├── HolidayList.astro            # 假期列表
│   │   ├── CountryCard.astro            # 首页国家卡片
│   │   └── YearTabs.astro               # 年份切换标签
│   ├── data/
│   │   ├── cn/                          # 中国假期 JSON
│   │   │   ├── 2025.json
│   │   │   ├── 2026.json
│   │   │   └── 2027.json
│   │   ├── us/                          # 美国假期 JSON
│   │   │   ├── 2025.json
│   │   │   ├── 2026.json
│   │   │   └── 2027.json
│   │   ├── de/                          # 德国假期 JSON
│   │   │   ├── 2025.json
│   │   │   ├── 2026.json
│   │   │   └── 2027.json
│   │   └── countries.ts                 # 国家元数据
│   ├── utils/
│   │   ├── calendar.ts                  # 日历计算
│   │   └── ical.ts                      # iCal 字符串生成
│   └── styles/
│       └── print.css                    # 打印专用样式
├── public/
│   └── favicon.ico
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
└── tsconfig.json
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tailwind.config.mjs`, `tsconfig.json`, `.gitignore`, `src/styles/print.css`

- [ ] **Step 1: 创建 package.json**

```bash
cd "D:/My Doc/website code/holiday-calendar"
npm init -y
```

- [ ] **Step 2: 安装依赖**

```bash
npm install astro@latest tailwindcss @tailwindcss/vite typescript
```

- [ ] **Step 3: 创建 astro.config.mjs**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
  site: 'https://holiday-calendar.pages.dev',
});
```

- [ ] **Step 4: 创建 tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: 更新 package.json scripts**

确保 package.json 包含：
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

- [ ] **Step 6: 创建打印样式文件 src/styles/print.css**

```css
/* src/styles/print.css — 全局打印重置 */
@media print {
  .print-hide { display: none !important; }
  body { 
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
}
```

- [ ] **Step 7: 确保 .gitignore 包含必要条目**

```
.superpowers/
node_modules/
dist/
```

- [ ] **Step 8: 验证项目可启动**

```bash
npx astro dev
```
期望：开发服务器在 localhost:4321 启动，页面空白但无报错。

- [ ] **Step 9: 提交**

```bash
git add -A && git commit -m "chore: scaffold Astro + Tailwind + TypeScript project"
```

---

### Task 2: 类型定义 + 国家元数据

**Files:**
- Create: `src/types.ts`, `src/data/countries.ts`

- [ ] **Step 1: 创建 src/types.ts**

```ts
// src/types.ts
export type HolidayType = 'public' | 'observance' | 'traditional';

export interface Holiday {
  name: string;
  nameEn: string;
  date: string;       // YYYY-MM-DD
  type: HolidayType;
  daysOff?: number;
  notes?: string;
}

export interface Workday {
  date: string;
  notes?: string;
}

export interface CountryData {
  country: string;
  year: number;
  timezone: string;
  holidays: Holiday[];
  workdays?: Workday[];
}

export interface CountryMeta {
  code: string;
  name: string;
  flag: string;
  timezone: string;
  description: string;
  sourceUrl: string;
  sourceLabel: string;
  publicHolidayCount: number;
}
```

- [ ] **Step 2: 创建 src/data/countries.ts**

```ts
// src/data/countries.ts
import type { CountryMeta } from '../types';

export const countries: CountryMeta[] = [
  {
    code: 'cn',
    name: '中国',
    flag: '🇨🇳',
    timezone: 'Asia/Shanghai',
    description: '涵盖中国大陆法定节假日、调休安排及传统节日',
    sourceUrl: 'https://www.gov.cn/zhengce/content/202511/content_7047090.htm',
    sourceLabel: '国务院办公厅通知',
    publicHolidayCount: 11,
  },
  {
    code: 'us',
    name: '美国',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    description: '包含美国联邦政府法定假日及主要庆祝节日',
    sourceUrl: 'https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/',
    sourceLabel: '美国人事管理局 (OPM)',
    publicHolidayCount: 11,
  },
  {
    code: 'de',
    name: '德国',
    flag: '🇩🇪',
    timezone: 'Europe/Berlin',
    description: '德国全国性公共假日及各州主要庆祝日',
    sourceUrl: 'https://www.schulferien.org/deutschland/feiertage/',
    sourceLabel: 'Schulferien.org',
    publicHolidayCount: 9,
  },
];

export const defaultYear = 2026;

export function getCountryMeta(code: string): CountryMeta | undefined {
  return countries.find((c) => c.code === code);
}

export function isValidCountry(code: string): boolean {
  return countries.some((c) => c.code === code);
}
```

- [ ] **Step 3: 验证 TypeScript 无类型错误**

```bash
npx astro check
```
期望：无类型错误输出。

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add type definitions and country metadata"
```

---

### Task 3: 中国假期数据 (2025-2027)

**Files:**
- Create: `src/data/cn/2025.json`, `src/data/cn/2026.json`, `src/data/cn/2027.json`

- [ ] **Step 1: 创建 src/data/cn/2026.json**

```json
{
  "country": "cn",
  "year": 2026,
  "timezone": "Asia/Shanghai",
  "holidays": [
    {
      "name": "元旦",
      "nameEn": "New Year's Day",
      "date": "2026-01-01",
      "type": "public",
      "daysOff": 1
    },
    {
      "name": "春节",
      "nameEn": "Chinese New Year",
      "date": "2026-02-17",
      "type": "traditional",
      "daysOff": 7,
      "notes": "2月17日至23日放假调休，2月14日（周六）、2月28日（周六）上班"
    },
    {
      "name": "清明节",
      "nameEn": "Qingming Festival",
      "date": "2026-04-05",
      "type": "traditional",
      "daysOff": 3,
      "notes": "4月5日至7日放假"
    },
    {
      "name": "劳动节",
      "nameEn": "Labor Day",
      "date": "2026-05-01",
      "type": "public",
      "daysOff": 5,
      "notes": "5月1日至5日放假调休，4月26日（周日）、5月9日（周六）上班"
    },
    {
      "name": "端午节",
      "nameEn": "Dragon Boat Festival",
      "date": "2026-06-20",
      "type": "traditional",
      "daysOff": 3,
      "notes": "6月20日至22日放假"
    },
    {
      "name": "中秋节",
      "nameEn": "Mid-Autumn Festival",
      "date": "2026-09-27",
      "type": "traditional",
      "daysOff": 3,
      "notes": "9月27日至29日放假"
    },
    {
      "name": "国庆节",
      "nameEn": "National Day",
      "date": "2026-10-01",
      "type": "public",
      "daysOff": 7,
      "notes": "10月1日至7日放假调休，9月20日（周日）、10月10日（周六）上班"
    }
  ],
  "workdays": [
    { "date": "2026-02-14", "notes": "春节调休补班" },
    { "date": "2026-02-28", "notes": "春节调休补班" },
    { "date": "2026-04-26", "notes": "劳动节调休补班" },
    { "date": "2026-05-09", "notes": "劳动节调休补班" },
    { "date": "2026-09-20", "notes": "国庆节调休补班" },
    { "date": "2026-10-10", "notes": "国庆节调休补班" }
  ]
}
```

- [ ] **Step 2: 创建 src/data/cn/2025.json**

```json
{
  "country": "cn",
  "year": 2025,
  "timezone": "Asia/Shanghai",
  "holidays": [
    { "name": "元旦", "nameEn": "New Year's Day", "date": "2025-01-01", "type": "public", "daysOff": 1 },
    { "name": "春节", "nameEn": "Chinese New Year", "date": "2025-01-29", "type": "traditional", "daysOff": 7, "notes": "1月29日至2月4日放假调休" },
    { "name": "清明节", "nameEn": "Qingming Festival", "date": "2025-04-05", "type": "traditional", "daysOff": 3, "notes": "4月5日至7日放假" },
    { "name": "劳动节", "nameEn": "Labor Day", "date": "2025-05-01", "type": "public", "daysOff": 5, "notes": "5月1日至5日放假调休" },
    { "name": "端午节", "nameEn": "Dragon Boat Festival", "date": "2025-05-31", "type": "traditional", "daysOff": 3, "notes": "5月31日至6月2日放假" },
    { "name": "中秋节+国庆节", "nameEn": "Mid-Autumn Festival & National Day", "date": "2025-10-01", "type": "public", "daysOff": 8, "notes": "10月1日至8日放假调休" }
  ],
  "workdays": [
    { "date": "2025-01-26", "notes": "春节调休补班" },
    { "date": "2025-02-08", "notes": "春节调休补班" },
    { "date": "2025-04-27", "notes": "劳动节调休补班" },
    { "date": "2025-09-28", "notes": "国庆节调休补班" },
    { "date": "2025-10-11", "notes": "国庆节调休补班" }
  ]
}
```

- [ ] **Step 3: 创建 src/data/cn/2027.json**

```json
{
  "country": "cn",
  "year": 2027,
  "timezone": "Asia/Shanghai",
  "holidays": [
    { "name": "元旦", "nameEn": "New Year's Day", "date": "2027-01-01", "type": "public", "daysOff": 1 },
    { "name": "春节", "nameEn": "Chinese New Year", "date": "2027-02-06", "type": "traditional", "daysOff": 7, "notes": "2月6日至12日放假调休" },
    { "name": "清明节", "nameEn": "Qingming Festival", "date": "2027-04-05", "type": "traditional", "daysOff": 3, "notes": "4月5日至7日放假" },
    { "name": "劳动节", "nameEn": "Labor Day", "date": "2027-05-01", "type": "public", "daysOff": 5, "notes": "5月1日至5日放假调休" },
    { "name": "端午节", "nameEn": "Dragon Boat Festival", "date": "2027-06-09", "type": "traditional", "daysOff": 3, "notes": "6月9日至11日放假" },
    { "name": "中秋节", "nameEn": "Mid-Autumn Festival", "date": "2027-09-16", "type": "traditional", "daysOff": 3, "notes": "9月16日至18日放假" },
    { "name": "国庆节", "nameEn": "National Day", "date": "2027-10-01", "type": "public", "daysOff": 7, "notes": "10月1日至7日放假调休" }
  ],
  "workdays": []
}
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add China holiday data (2025-2027)"
```

---

### Task 4: 美国假期数据 (2025-2027)

**Files:**
- Create: `src/data/us/2025.json`, `src/data/us/2026.json`, `src/data/us/2027.json`

- [ ] **Step 1: 创建 src/data/us/2026.json**

```json
{
  "country": "us",
  "year": 2026,
  "timezone": "America/New_York",
  "holidays": [
    { "name": "新年", "nameEn": "New Year's Day", "date": "2026-01-01", "type": "public", "notes": "1月1日" },
    { "name": "马丁·路德·金纪念日", "nameEn": "Martin Luther King Jr. Day", "date": "2026-01-19", "type": "public", "notes": "一月第三个周一" },
    { "name": "总统日", "nameEn": "Presidents' Day", "date": "2026-02-16", "type": "public", "notes": "二月第三个周一" },
    { "name": "阵亡将士纪念日", "nameEn": "Memorial Day", "date": "2026-05-25", "type": "public", "notes": "五月最后一个周一" },
    { "name": "六月节", "nameEn": "Juneteenth", "date": "2026-06-19", "type": "public", "notes": "6月19日" },
    { "name": "独立日", "nameEn": "Independence Day", "date": "2026-07-04", "type": "public", "notes": "7月4日（7月3日补假）" },
    { "name": "劳动节", "nameEn": "Labor Day", "date": "2026-09-07", "type": "public", "notes": "九月第一个周一" },
    { "name": "哥伦布日", "nameEn": "Columbus Day", "date": "2026-10-12", "type": "public", "notes": "十月第二个周一" },
    { "name": "退伍军人节", "nameEn": "Veterans Day", "date": "2026-11-11", "type": "public", "notes": "11月11日" },
    { "name": "感恩节", "nameEn": "Thanksgiving Day", "date": "2026-11-26", "type": "public", "notes": "十一月第四个周四" },
    { "name": "圣诞节", "nameEn": "Christmas Day", "date": "2026-12-25", "type": "public", "notes": "12月25日" },
    { "name": "情人节", "nameEn": "Valentine's Day", "date": "2026-02-14", "type": "observance" },
    { "name": "万圣节", "nameEn": "Halloween", "date": "2026-10-31", "type": "observance" }
  ]
}
```

- [ ] **Step 2: 创建 src/data/us/2025.json** (13个联邦假期 + 2个庆祝日，日期按2025实际日历计算)

```json
{
  "country": "us",
  "year": 2025,
  "timezone": "America/New_York",
  "holidays": [
    { "name": "新年", "nameEn": "New Year's Day", "date": "2025-01-01", "type": "public" },
    { "name": "马丁·路德·金纪念日", "nameEn": "Martin Luther King Jr. Day", "date": "2025-01-20", "type": "public" },
    { "name": "总统日", "nameEn": "Presidents' Day", "date": "2025-02-17", "type": "public" },
    { "name": "阵亡将士纪念日", "nameEn": "Memorial Day", "date": "2025-05-26", "type": "public" },
    { "name": "六月节", "nameEn": "Juneteenth", "date": "2025-06-19", "type": "public" },
    { "name": "独立日", "nameEn": "Independence Day", "date": "2025-07-04", "type": "public" },
    { "name": "劳动节", "nameEn": "Labor Day", "date": "2025-09-01", "type": "public" },
    { "name": "哥伦布日", "nameEn": "Columbus Day", "date": "2025-10-13", "type": "public" },
    { "name": "退伍军人节", "nameEn": "Veterans Day", "date": "2025-11-11", "type": "public" },
    { "name": "感恩节", "nameEn": "Thanksgiving Day", "date": "2025-11-27", "type": "public" },
    { "name": "圣诞节", "nameEn": "Christmas Day", "date": "2025-12-25", "type": "public" },
    { "name": "情人节", "nameEn": "Valentine's Day", "date": "2025-02-14", "type": "observance" },
    { "name": "万圣节", "nameEn": "Halloween", "date": "2025-10-31", "type": "observance" }
  ]
}
```

- [ ] **Step 3: 创建 src/data/us/2027.json** (模板数据，日期按2027推算)

```json
{
  "country": "us",
  "year": 2027,
  "timezone": "America/New_York",
  "holidays": [
    { "name": "新年", "nameEn": "New Year's Day", "date": "2027-01-01", "type": "public" },
    { "name": "马丁·路德·金纪念日", "nameEn": "Martin Luther King Jr. Day", "date": "2027-01-18", "type": "public" },
    { "name": "总统日", "nameEn": "Presidents' Day", "date": "2027-02-15", "type": "public" },
    { "name": "阵亡将士纪念日", "nameEn": "Memorial Day", "date": "2027-05-31", "type": "public" },
    { "name": "六月节", "nameEn": "Juneteenth", "date": "2027-06-19", "type": "public" },
    { "name": "独立日", "nameEn": "Independence Day", "date": "2027-07-04", "type": "public", "notes": "7月4日（7月5日补假）" },
    { "name": "劳动节", "nameEn": "Labor Day", "date": "2027-09-06", "type": "public" },
    { "name": "哥伦布日", "nameEn": "Columbus Day", "date": "2027-10-11", "type": "public" },
    { "name": "退伍军人节", "nameEn": "Veterans Day", "date": "2027-11-11", "type": "public" },
    { "name": "感恩节", "nameEn": "Thanksgiving Day", "date": "2027-11-25", "type": "public" },
    { "name": "圣诞节", "nameEn": "Christmas Day", "date": "2027-12-25", "type": "public" },
    { "name": "情人节", "nameEn": "Valentine's Day", "date": "2027-02-14", "type": "observance" },
    { "name": "万圣节", "nameEn": "Halloween", "date": "2027-10-31", "type": "observance" }
  ]
}
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add USA holiday data (2025-2027)"
```

---

### Task 5: 德国假期数据 (2025-2027)

**Files:**
- Create: `src/data/de/2025.json`, `src/data/de/2026.json`, `src/data/de/2027.json`

- [ ] **Step 1: 创建 src/data/de/2026.json**

```json
{
  "country": "de",
  "year": 2026,
  "timezone": "Europe/Berlin",
  "holidays": [
    { "name": "元旦", "nameEn": "New Year's Day (Neujahrstag)", "date": "2026-01-01", "type": "public" },
    { "name": "耶稣受难日", "nameEn": "Good Friday (Karfreitag)", "date": "2026-04-03", "type": "public" },
    { "name": "复活节周一", "nameEn": "Easter Monday (Ostermontag)", "date": "2026-04-06", "type": "public" },
    { "name": "劳动节", "nameEn": "Labor Day (Tag der Arbeit)", "date": "2026-05-01", "type": "public" },
    { "name": "耶稣升天日", "nameEn": "Ascension Day (Christi Himmelfahrt)", "date": "2026-05-14", "type": "public" },
    { "name": "圣灵降临节周一", "nameEn": "Whit Monday (Pfingstmontag)", "date": "2026-05-25", "type": "public" },
    { "name": "德国统一日", "nameEn": "German Unity Day (Tag der Deutschen Einheit)", "date": "2026-10-03", "type": "public" },
    { "name": "圣诞节", "nameEn": "Christmas Day (1. Weihnachtstag)", "date": "2026-12-25", "type": "public" },
    { "name": "节礼日", "nameEn": "Boxing Day (2. Weihnachtstag)", "date": "2026-12-26", "type": "public" }
  ]
}
```

- [ ] **Step 2: 创建 src/data/de/2025.json**

```json
{
  "country": "de",
  "year": 2025,
  "timezone": "Europe/Berlin",
  "holidays": [
    { "name": "元旦", "nameEn": "New Year's Day (Neujahrstag)", "date": "2025-01-01", "type": "public" },
    { "name": "耶稣受难日", "nameEn": "Good Friday (Karfreitag)", "date": "2025-04-18", "type": "public" },
    { "name": "复活节周一", "nameEn": "Easter Monday (Ostermontag)", "date": "2025-04-21", "type": "public" },
    { "name": "劳动节", "nameEn": "Labor Day (Tag der Arbeit)", "date": "2025-05-01", "type": "public" },
    { "name": "耶稣升天日", "nameEn": "Ascension Day (Christi Himmelfahrt)", "date": "2025-05-29", "type": "public" },
    { "name": "圣灵降临节周一", "nameEn": "Whit Monday (Pfingstmontag)", "date": "2025-06-09", "type": "public" },
    { "name": "德国统一日", "nameEn": "German Unity Day", "date": "2025-10-03", "type": "public" },
    { "name": "圣诞节", "nameEn": "Christmas Day (1. Weihnachtstag)", "date": "2025-12-25", "type": "public" },
    { "name": "节礼日", "nameEn": "Boxing Day (2. Weihnachtstag)", "date": "2025-12-26", "type": "public" }
  ]
}
```

- [ ] **Step 3: 创建 src/data/de/2027.json**

```json
{
  "country": "de",
  "year": 2027,
  "timezone": "Europe/Berlin",
  "holidays": [
    { "name": "元旦", "nameEn": "New Year's Day (Neujahrstag)", "date": "2027-01-01", "type": "public" },
    { "name": "耶稣受难日", "nameEn": "Good Friday (Karfreitag)", "date": "2027-03-26", "type": "public" },
    { "name": "复活节周一", "nameEn": "Easter Monday (Ostermontag)", "date": "2027-03-29", "type": "public" },
    { "name": "劳动节", "nameEn": "Labor Day (Tag der Arbeit)", "date": "2027-05-01", "type": "public" },
    { "name": "耶稣升天日", "nameEn": "Ascension Day (Christi Himmelfahrt)", "date": "2027-05-06", "type": "public" },
    { "name": "圣灵降临节周一", "nameEn": "Whit Monday (Pfingstmontag)", "date": "2027-05-17", "type": "public" },
    { "name": "德国统一日", "nameEn": "German Unity Day", "date": "2027-10-03", "type": "public" },
    { "name": "圣诞节", "nameEn": "Christmas Day (1. Weihnachtstag)", "date": "2027-12-25", "type": "public" },
    { "name": "节礼日", "nameEn": "Boxing Day (2. Weihnachtstag)", "date": "2027-12-26", "type": "public" }
  ]
}
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add Germany holiday data (2025-2027)"
```

---

### Task 6: 日历工具函数

**Files:**
- Create: `src/utils/calendar.ts`

- [ ] **Step 1: 创建 src/utils/calendar.ts**

```ts
// src/utils/calendar.ts
import type { CountryData, Holiday } from '../types';

export interface CalendarDay {
  day: number;
  date: string;          // YYYY-MM-DD
  isCurrentMonth: boolean;
  holidays: Holiday[];
  isWorkday?: boolean;   // 调休上班日
}

export interface CalendarMonth {
  year: number;
  month: number;         // 1-12
  monthName: string;
  weeks: CalendarDay[][];
  holidays: Holiday[];
}

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export function getWeekdayNames(): string[] {
  return WEEKDAY_NAMES;
}

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1];
}

function formatDate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function buildMonthGrid(year: number, month: number, data: CountryData): CalendarMonth {
  const holidaysByDate = new Map<string, Holiday[]>();
  for (const h of data.holidays) {
    const existing = holidaysByDate.get(h.date) || [];
    existing.push(h);
    holidaysByDate.set(h.date, existing);
  }

  const workdayDates = new Set(data.workdays?.map((w) => w.date) || []);

  const firstDay = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDay.getDay(); // 0=Sun in JS

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  // Previous month fill
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const date = formatDate(prevYear, prevMonth, day);
    currentWeek.push({
      day,
      date,
      isCurrentMonth: false,
      holidays: holidaysByDate.get(date) || [],
    });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(year, month, day);
    currentWeek.push({
      day,
      date,
      isCurrentMonth: true,
      holidays: holidaysByDate.get(date) || [],
      isWorkday: workdayDates.has(date),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Next month fill
  if (currentWeek.length > 0) {
    let nextDay = 1;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    while (currentWeek.length < 7) {
      const date = formatDate(nextYear, nextMonth, nextDay);
      currentWeek.push({
        day: nextDay,
        date,
        isCurrentMonth: false,
        holidays: holidaysByDate.get(date) || [],
      });
      nextDay++;
    }
    weeks.push(currentWeek);
  }

  // Collect holidays for this month
  const monthHolidays = data.holidays.filter((h) => {
    const d = new Date(h.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  return { year, month, monthName: getMonthName(month), weeks, holidays: monthHolidays };
}

export function getAllMonths(year: number, data: CountryData): CalendarMonth[] {
  return Array.from({ length: 12 }, (_, i) => buildMonthGrid(year, i + 1, data));
}

/** 按假期类型返回 Tailwind 背景色类名 */
export function getHolidayBgClass(type: string): string {
  switch (type) {
    case 'public':
      return 'bg-red-100 text-red-800';
    case 'observance':
      return 'bg-orange-100 text-orange-800';
    case 'traditional':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
```

- [ ] **Step 2: 验证编译**

```bash
npx astro check
```
期望：无报错。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add calendar utility functions"
```

---

### Task 7: iCal 生成工具

**Files:**
- Create: `src/utils/ical.ts`

- [ ] **Step 1: 创建 src/utils/ical.ts**

```ts
// src/utils/ical.ts
import type { CountryData, Holiday } from '../types';

function formatICalDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function escapeICalText(text: string): string {
  return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
}

const COUNTRY_NAMES: Record<string, string> = {
  cn: '中国',
  us: '美国',
  de: '德国',
};

export function generateICS(data: CountryData): string {
  const countryName = COUNTRY_NAMES[data.country] || data.country.toUpperCase();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//HolidayCalendar//${data.country.toUpperCase()}`,
    `X-WR-CALNAME:${data.year}年${countryName}假期`,
    `X-WR-CALDESC:${countryName}${data.year}年法定节假日`,
    'REFRESH-INTERVAL;VALUE=DURATION:P1W',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const holiday of data.holidays) {
    // Only include public and traditional holidays as events
    if (holiday.type === 'observance') continue;

    const dtStart = formatICalDate(holiday.date);

    // DTEND is exclusive in iCal: date + 1 day
    const endDate = new Date(holiday.date);
    endDate.setDate(endDate.getDate() + (holiday.daysOff || 1));
    const dtEnd = formatICalDate(
      endDate.toISOString().split('T')[0]
    );

    lines.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${escapeICalText(holiday.name)}`,
      `DESCRIPTION:${escapeICalText(holiday.notes || holiday.name)}`,
      'TRANSP:TRANSPARENT',
    );

    // Add alarm 15 hours before
    lines.push(
      'BEGIN:VALARM',
      'TRIGGER:-PT15H',
      'ACTION:DISPLAY',
      `DESCRIPTION:明天是${escapeICalText(holiday.name)}假期！`,
      'END:VALARM',
    );

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
```

- [ ] **Step 2: 验证编译**

```bash
npx astro check
```
期望：无报错。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add iCal generation utility"
```

---

### Task 8: BaseLayout 组件

**Files:**
- Create: `src/components/BaseLayout.astro`

- [ ] **Step 1: 创建 src/components/BaseLayout.astro**

```astro
---
// src/components/BaseLayout.astro
import '../styles/print.css';

interface Props {
  title: string;
  description: string;
  canonicalUrl?: string;
}

const { title, description, canonicalUrl } = Astro.props;
const siteName = 'Holiday Calendar';
const fullTitle = `${title} — ${siteName}`;
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="icon" href="/favicon.ico" />
    {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    <!-- TODO: add Google Analytics in a later task -->
  </head>
  <body class="min-h-screen bg-white text-gray-900 antialiased">
    <!-- Header -->
    <header class="print-hide border-b border-gray-200 bg-white sticky top-0 z-10">
      <div class="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <a href="/" class="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
          📅 {siteName}
        </a>
        <nav class="flex items-center gap-4 text-sm text-gray-600">
          <a href="/subscribe/" class="hover:text-blue-600 transition-colors">订阅指南</a>
          <a href="/about/" class="hover:text-blue-600 transition-colors">关于</a>
        </nav>
      </div>
    </header>

    <!-- Main content -->
    <main class="mx-auto max-w-5xl px-4 py-6">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="print-hide border-t border-gray-200 bg-gray-50 mt-12">
      <div class="mx-auto max-w-5xl px-4 py-8 text-sm text-gray-500">
        <div class="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p class="font-medium text-gray-700">📅 Holiday Calendar</p>
            <p class="mt-1">各国公共假期日历，支持 iCal 订阅和打印</p>
          </div>
          <div class="flex gap-6">
            <a href="/about/" class="hover:text-blue-600 transition-colors">关于本站</a>
            <a href="/subscribe/" class="hover:text-blue-600 transition-colors">订阅指南</a>
          </div>
        </div>
        <p class="mt-6 text-xs text-gray-400">
          © 2026 Holiday Calendar. 数据来源为各国政府官方网站。
        </p>
      </div>
    </footer>
  </body>
</html>
```

- [ ] **Step 2: 验证 dev server 可启动**

```bash
npx astro dev
```
期望：localhost:4321 启动成功（页面仍空白因为还没有页面）。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add BaseLayout component with header and footer"
```

---

### Task 9: MonthGrid 组件

**Files:**
- Create: `src/components/MonthGrid.astro`

- [ ] **Step 1: 创建 src/components/MonthGrid.astro**

```astro
---
// src/components/MonthGrid.astro
import { getWeekdayNames, getHolidayBgClass } from '../utils/calendar';
import type { CalendarMonth, CalendarDay } from '../utils/calendar';

interface Props {
  month: CalendarMonth;
}

const { month } = Astro.props;
const weekdayNames = getWeekdayNames();

function getDayCellClass(day: CalendarDay): string {
  const classes: string[] = [];
  if (!day.isCurrentMonth) {
    classes.push('text-gray-300');
  }
  if (day.holidays.length > 0) {
    const bgClass = getHolidayBgClass(day.holidays[0].type);
    classes.push(bgClass, 'font-semibold', 'rounded');
  }
  if (day.isWorkday) {
    classes.push('bg-gray-200', 'text-gray-500', 'rounded');
  }
  return classes.join(' ');
}
---

<div class="border border-gray-200 rounded-lg overflow-hidden">
  <div class="bg-gray-50 px-3 py-2 text-center font-semibold text-sm text-gray-700">
    {month.monthName}
  </div>
  <!-- Weekday headers -->
  <div class="grid grid-cols-7 text-center text-xs text-gray-400 py-1">
    {weekdayNames.map((name) => (
      <span>{name}</span>
    ))}
  </div>
  <!-- Day grid -->
  <div class="grid grid-cols-7 text-center text-xs gap-px bg-gray-100">
    {
      month.weeks.flatMap((week) =>
        week.map((day) => (
          <div class={`py-1 bg-white ${getDayCellClass(day)}`}>
            {day.isCurrentMonth ? day.day : ''}
          </div>
        ))
      )
    }
  </div>
  <!-- Holiday labels -->
  {
    month.holidays.length > 0 && (
      <div class="px-2 py-1 border-t border-gray-100">
        {month.holidays.map((h) => {
          const bgClass = getHolidayBgClass(h.type);
          return (
            <span class={`inline-block text-xs px-1.5 py-0.5 rounded mr-1 mb-1 ${bgClass}`}>
              {h.name} {h.date.slice(5)}
            </span>
          );
        })}
      </div>
    )
  }
</div>
```

- [ ] **Step 2: 验证编译**

```bash
npx astro check
```
期望：无报错。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add MonthGrid component"
```

---

### Task 10: Calendar 组件 (12个月容器)

**Files:**
- Create: `src/components/Calendar.astro`

- [ ] **Step 1: 创建 src/components/Calendar.astro**

```astro
---
// src/components/Calendar.astro
import MonthGrid from './MonthGrid.astro';
import { getAllMonths } from '../utils/calendar';
import type { CountryData } from '../types';

interface Props {
  data: CountryData;
}

const { data } = Astro.props;
const months = getAllMonths(data.year, data);
---

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {months.map((month) => <MonthGrid month={month} />)}
</div>
```

- [ ] **Step 2: 验证编译**

```bash
npx astro check
```
期望：无报错。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add Calendar component (12-month grid)"
```

---

### Task 11: HolidayList + YearTabs + CountryCard 组件

**Files:**
- Create: `src/components/HolidayList.astro`, `src/components/YearTabs.astro`, `src/components/CountryCard.astro`

- [ ] **Step 1: 创建 src/components/HolidayList.astro**

```astro
---
// src/components/HolidayList.astro
import { getHolidayBgClass } from '../utils/calendar';
import type { CountryData } from '../types';

interface Props {
  data: CountryData;
}

const { data } = Astro.props;
---

<div class="mt-6">
  <details class="group">
    <summary class="cursor-pointer text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors list-none">
      📋 {data.year}年假期列表
      <span class="text-sm text-gray-400 ml-1">({data.holidays.length}个)</span>
    </summary>
    <div class="mt-3 overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-gray-200 text-left text-gray-500">
            <th class="py-2 pr-4 font-medium">日期</th>
            <th class="py-2 pr-4 font-medium">名称</th>
            <th class="py-2 pr-4 font-medium">类型</th>
            <th class="py-2 font-medium">备注</th>
          </tr>
        </thead>
        <tbody>
          {data.holidays.map((h) => {
            const bgClass = getHolidayBgClass(h.type);
            const typeLabel = h.type === 'public' ? '公休日' : h.type === 'observance' ? '庆祝日' : '传统节日';
            return (
              <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-2 pr-4 text-gray-600 whitespace-nowrap">{h.date}</td>
                <td class="py-2 pr-4 font-medium">{h.name}</td>
                <td class="py-2 pr-4">
                  <span class={`inline-block text-xs px-1.5 py-0.5 rounded ${bgClass}`}>{typeLabel}</span>
                </td>
                <td class="py-2 text-gray-500">{h.notes || (h.daysOff ? `${h.daysOff}天假期` : '')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </details>
</div>

<style>
  details summary::-webkit-details-marker { display: none; }
</style>
```

- [ ] **Step 2: 创建 src/components/YearTabs.astro**

```astro
---
// src/components/YearTabs.astro
interface Props {
  country: string;
  currentYear: number;
  availableYears: number[];
}

const { country, currentYear, availableYears } = Astro.props;
---

<div class="flex flex-wrap gap-2 mb-4">
  {availableYears.map((year) => (
    <a
      href={`/${country}/${year}/`}
      class={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        year === currentYear
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {year}
    </a>
  ))}
</div>
```

- [ ] **Step 3: 创建 src/components/CountryCard.astro**

```astro
---
// src/components/CountryCard.astro
import type { CountryMeta } from '../types';

interface Props {
  country: CountryMeta;
}

const { country } = Astro.props;
---

<a
  href={`/${country.code}/`}
  class="block border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all text-center group"
>
  <div class="text-4xl mb-3">{country.flag}</div>
  <h3 class="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
    {country.name}
  </h3>
  <p class="text-sm text-gray-500 mt-1">
    {country.publicHolidayCount}个公休日
  </p>
  <p class="text-xs text-gray-400 mt-2 line-clamp-2">
    {country.description}
  </p>
</a>
```

- [ ] **Step 4: 验证编译**

```bash
npx astro check
```
期望：无报错。

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat: add HolidayList, YearTabs, and CountryCard components"
```

---

### Task 12: 首页

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: 创建 src/pages/index.astro**

```astro
---
// src/pages/index.astro
import BaseLayout from '../components/BaseLayout.astro';
import CountryCard from '../components/CountryCard.astro';
import { countries, defaultYear } from '../data/countries';
---

<BaseLayout
  title={`${defaultYear}年各国假期日历`}
  description="了解全球公共假期，规划完美旅程。提供中国、美国、德国等国家法定节假日日历，支持 iCal 订阅和精美打印。"
  canonicalUrl="https://holiday-calendar.pages.dev/"
>
  <div class="text-center mb-10">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">
      {defaultYear}年各国假期日历
    </h1>
    <p class="text-gray-500">
      了解公共假期，规划完美旅程
    </p>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
    {countries.map((c) => <CountryCard country={c} />)}
    <!-- 占位卡片 -->
    <div class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 flex flex-col items-center justify-center min-h-[160px]">
      <div class="text-2xl mb-2">🌍</div>
      <p class="text-sm">更多国家即将上线...</p>
    </div>
  </div>

  <!-- 广告位预留：首页底部横幅 -->
  <div class="mt-12 text-center">
    <div class="inline-block border border-dashed border-gray-300 rounded-lg px-8 py-4 text-xs text-gray-400">
      广告位预留 — 728×90
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 2: 运行 dev server 确认首页可访问**

```bash
npx astro dev
```
期望：打开 http://localhost:4321 看到首页，3 张国家卡片 + 占位卡片。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add homepage with country cards"
```

---

### Task 13: 国家年份日历页

**Files:**
- Create: `src/pages/[country]/[year].astro`

- [ ] **Step 1: 创建 src/pages/[country]/[year].astro**

```astro
---
// src/pages/[country]/[year].astro
import BaseLayout from '../../components/BaseLayout.astro';
import Calendar from '../../components/Calendar.astro';
import HolidayList from '../../components/HolidayList.astro';
import YearTabs from '../../components/YearTabs.astro';
import { getCountryMeta, countries, defaultYear } from '../../data/countries';
import type { CountryData } from '../../types';

export function getStaticPaths() {
  const paths: { params: { country: string; year: string } }[] = [];
  for (const c of countries) {
    for (const year of [2025, 2026, 2027]) {
      paths.push({ params: { country: c.code, year: String(year) } });
    }
  }
  return paths;
}

const { country, year } = Astro.params;
const yearNum = parseInt(year, 10);
const meta = getCountryMeta(country);

// Load holiday data dynamically
let data: CountryData;
try {
  data = (await import(`../../data/${country}/${year}.json`)).default;
} catch {
  return Astro.redirect('/404');
}

const totalHolidayDays = data.holidays
  .filter((h) => h.type !== 'observance')
  .reduce((sum, h) => sum + (h.daysOff || 1), 0);

const availableYears = [2025, 2026, 2027];
---

<BaseLayout
  title={`${meta?.name || country} ${year}年假期日历`}
  description={`查看${meta?.name || country}${year}年法定节假日安排，包括${data.holidays.slice(0, 3).map(h => h.name).join('、')}等假期，支持 iCal 订阅下载和打印。`}
  canonicalUrl={`https://holiday-calendar.pages.dev/${country}/${year}/`}
>
  <div class="mb-6">
    <!-- Country header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {meta?.flag} {meta?.name} · {year}年
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          {data.holidays.filter(h => h.type !== 'observance').length}个节假日 · {totalHolidayDays}天假期
        </p>
      </div>
      <!-- Action buttons -->
      <div class="flex gap-2 print-hide">
        <a
          href={`/ics/${country}-${year}.ics`}
          class="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          📥 导入日历
        </a>
        <a
          href={`/print/${country}/${year}/`}
          target="_blank"
          class="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          🖨️ 打印
        </a>
      </div>
    </div>

    <!-- Year tabs -->
    <YearTabs country={country} currentYear={yearNum} availableYears={availableYears} />
  </div>

  <!-- Calendar grid -->
  <Calendar data={data} />

  <!-- Holiday list -->
  <HolidayList data={data} />

  <!-- Data source -->
  <div class="mt-8 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
    <p>
      数据来源：
      {meta?.sourceLabel && (
        <a href={meta.sourceUrl} target="_blank" rel="noopener" class="text-blue-600 hover:underline">
          {meta.sourceLabel}
        </a>
      )}
      {!meta?.sourceLabel && '各国政府官方网站'}
      · 最后更新 {data.year} 年
      · <a href="/about/" class="text-blue-600 hover:underline">反馈错误</a>
    </p>
  </div>

  <!-- 广告位预留 -->
  <div class="mt-6 text-center print-hide">
    <div class="inline-block border border-dashed border-gray-300 rounded-lg px-8 py-4 text-xs text-gray-400">
      广告位预留 — 160×600
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 2: 验证编译和路由**

```bash
npx astro build
```
期望：生成 `/cn/2026/`, `/us/2026/`, `/de/2026/` 等 9 个日历页。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add country year calendar pages with dynamic routes"
```

---

### Task 14: 国家页重定向 + 404 页

**Files:**
- Create: `src/pages/[country]/index.astro`, `src/pages/404.astro`

- [ ] **Step 1: 创建 src/pages/[country]/index.astro**

```astro
---
// src/pages/[country]/index.astro — 重定向到今年
import { countries, defaultYear } from '../../data/countries';

export function getStaticPaths() {
  return countries.map((c) => ({ params: { country: c.code } }));
}

const { country } = Astro.params;

// Validate country exists
if (!countries.some((c) => c.code === country)) {
  return Astro.redirect('/404');
}

return Astro.redirect(`/${country}/${defaultYear}/`);
---
```

- [ ] **Step 2: 创建 src/pages/404.astro**

```astro
---
// src/pages/404.astro
import BaseLayout from '../components/BaseLayout.astro';
---

<BaseLayout
  title="页面未找到"
  description="抱歉，您访问的页面不存在。"
>
  <div class="text-center py-20">
    <div class="text-6xl mb-4">🔍</div>
    <h1 class="text-2xl font-bold text-gray-900 mb-2">404 — 页面未找到</h1>
    <p class="text-gray-500 mb-6">抱歉，您访问的页面不存在。</p>
    <a
      href="/"
      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      ← 返回首页
    </a>
  </div>
</BaseLayout>
```

- [ ] **Step 3: 验证重定向**

```bash
npx astro build && npx astro preview
```
期望：访问 `/cn/` 自动跳转到 `/cn/2026/`。访问不存在的国家跳转到 `/404`。

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add country redirect and 404 page"
```

---

### Task 15: iCal 静态文件端点

**Files:**
- Create: `src/pages/ics/[country]-[year].ics.ts`

- [ ] **Step 1: 创建 src/pages/ics/[country]-[year].ics.ts**

```ts
// src/pages/ics/[country]-[year].ics.ts
import type { APIRoute } from 'astro';
import { generateICS } from '../../utils/ical';
import { countries } from '../../data/countries';
import type { CountryData } from '../../types';

export function getStaticPaths() {
  const paths: { params: { country: string; year: string } }[] = [];
  for (const c of countries) {
    for (const year of [2025, 2026, 2027]) {
      // Create combined param: "cn-2026"
      paths.push({ params: { country: c.code, year: String(year) } });
    }
  }
  return paths;
}

export const GET: APIRoute = async ({ params }) => {
  const { country, year } = params;

  // Parse the combined country-year param
  const parts = country?.split('-');
  if (!parts || parts.length < 2) {
    return new Response('Not Found', { status: 404 });
  }

  const countryCode = parts[0];
  const yearStr = parts.slice(1).join('-');

  // Validate country
  if (!countries.some((c) => c.code === countryCode)) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const data: CountryData = (await import(`../../data/${countryCode}/${yearStr}.json`)).default;
    const icsContent = generateICS(data);

    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${countryCode}-${yearStr}.ics"`,
      },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
};
```

- [ ] **Step 2: 验证 .ics 文件生成**

```bash
npx astro build
```
期望：`dist/ics/cn-2026.ics` 等文件生成。检查内容以 `BEGIN:VCALENDAR` 开头。

```bash
head -5 dist/ics/cn-2026.ics
```
期望：
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HolidayCalendar//CN
X-WR-CALNAME:2026年中国假期
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add iCal static file endpoint"
```

---

### Task 16: 打印优化页

**Files:**
- Create: `src/pages/print/[country]/[year].astro`

- [ ] **Step 1: 创建 src/pages/print/[country]/[year].astro**

```astro
---
// src/pages/print/[country]/[year].astro
import { countries, getCountryMeta } from '../../data/countries';
import { getAllMonths, getHolidayBgClass, type CalendarDay } from '../../utils/calendar';
import type { CountryData } from '../../types';

export function getStaticPaths() {
  const paths: { params: { country: string; year: string } }[] = [];
  for (const c of countries) {
    for (const year of [2025, 2026, 2027]) {
      paths.push({ params: { country: c.code, year: String(year) } });
    }
  }
  return paths;
}

const { country, year } = Astro.params;
const yearNum = parseInt(year, 10);
const meta = getCountryMeta(country);

let data: CountryData;
try {
  data = (await import(`../../../data/${country}/${year}.json`)).default;
} catch {
  return Astro.redirect('/404');
}

const months = getAllMonths(yearNum, data);

function getDayClass(day: CalendarDay): string {
  if (!day.isCurrentMonth) return 'text-gray-300';
  if (day.holidays.length > 0) {
    const bgClass = getHolidayBgClass(day.holidays[0].type);
    return `${bgClass} font-semibold`;
  }
  if (day.isWorkday) return 'bg-gray-300 text-gray-600';
  return '';
}

function getHolidayHex(type: string): string {
  switch(type) {
    case 'public': return '#fecaca';       // red-200
    case 'observance': return '#fed7aa';   // orange-200
    case 'traditional': return '#fde68a';  // amber-200
    default: return '#e5e7eb';             // gray-200
  }
}
---

<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{meta?.name} {year}年假期日历 — 打印版</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    table { border-collapse: collapse; width: 100%; font-size: 11px; }
    td { padding: 2px 3px; text-align: center; border: 1px solid #e5e7eb; width: 14.28%; }
    th { padding: 4px; text-align: center; font-size: 10px; color: #9ca3af; }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', () => { window.print(); });
  </script>
</head>
<body>

  <div class="no-print" style="background: #eff6ff; padding: 10px 16px; margin-bottom: 16px; border-radius: 8px; font-size: 13px; display: flex; justify-content: space-between; align-items: center;">
    <span>🖨️ 打印页面 — 打印对话框应该已经自动弹出</span>
    <span>
      <select id="viewSelect" onchange="toggleView()" style="font-size:12px; padding:4px 8px; border-radius:4px; border:1px solid #d1d5db;">
        <option value="12">全年 (12个月)</option>
        <option value="6">半年 (前6个月)</option>
      </select>
    </span>
  </div>

  <h2 style="text-align:center; margin-bottom:4px;">{meta?.flag} {meta?.name} {year}年假期日历</h2>
  <p style="text-align:center; font-size:12px; color:#6b7280; margin-bottom:12px;">
    Holiday Calendar · holiday-calendar.pages.dev
  </p>

  <div id="calendarContainer" style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px;">
    {months.map((month) => (
      <div class="month-section">
        <h3 style="font-size:13px; font-weight:600; margin-bottom:3px; border-bottom:2px solid #e5e7eb; padding-bottom:2px;">{month.monthName}</h3>
        <table>
          <thead>
            <tr>
              <th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th>
            </tr>
          </thead>
          <tbody>
            {month.weeks.map((week) => (
              <tr>
                {week.map((day) => {
                  const bgColor = day.holidays.length > 0
                    ? getHolidayHex(day.holidays[0].type)
                    : (day.isWorkday ? '#e5e7eb' : 'transparent');
                  return (
                    <td style={`background-color: ${bgColor}; ${day.holidays.length > 0 ? 'font-weight: 700;' : ''} ${!day.isCurrentMonth ? 'color: #d1d5db;' : ''}`}>
                      {day.isCurrentMonth ? day.day : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {month.holidays.length > 0 && (
          <div style="font-size:8px; margin-top:2px; color:#6b7280;">
            {month.holidays.map((h) => (
              <span style={`background:${getHolidayHex(h.type)}; padding:0 2px; margin-right:2px; border-radius:2px;`}>{h.name}</span>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>

  <p style="text-align:center; font-size:11px; color:#9ca3af; margin-top:16px; border-top:1px solid #e5e7eb; padding-top:8px;">
    数据来源：{meta?.sourceLabel || '各国政府官方网站'} · holiday-calendar.pages.dev
  </p>

  <script>
    function toggleView() {
      const container = document.getElementById('calendarContainer');
      const select = document.getElementById('viewSelect');
      const children = container.children;
      for (let i = 0; i < children.length; i++) {
        children[i].style.display = select.value === '6' && i >= 6 ? 'none' : '';
      }
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: 验证打印页构建**

```bash
npx astro build
```
期望：`dist/print/cn/2026/index.html` 等文件生成。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add print-optimized calendar pages"
```

---

### Task 17: 关于页 + 订阅指南页

**Files:**
- Create: `src/pages/about.astro`, `src/pages/subscribe.astro`

- [ ] **Step 1: 创建 src/pages/about.astro**

```astro
---
// src/pages/about.astro
import BaseLayout from '../components/BaseLayout.astro';
import { countries } from '../data/countries';
---

<BaseLayout
  title="关于本站"
  description="Holiday Calendar 是一个免费的多国假期日历工具，支持 iCal 订阅和精美打印。"
  canonicalUrl="https://holiday-calendar.pages.dev/about/"
>
  <h1 class="text-2xl font-bold text-gray-900 mb-6">关于本站</h1>

  <div class="prose max-w-none text-gray-700 space-y-4">
    <p>
      Holiday Calendar 是一个免费的多国假期日历工具。我们汇集了多个国家和地区的公共假期信息，
      让您可以在一个地方查看、订阅和打印假期日历。
    </p>

    <h2 class="text-lg font-semibold text-gray-900 mt-6">目前覆盖</h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {countries.map((c) => (
        <a href={`/${c.code}/`} class="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
          <span class="text-2xl">{c.flag}</span>
          <span class="ml-2 font-medium text-gray-900">{c.name}</span>
          <p class="text-xs text-gray-500 mt-1">{c.publicHolidayCount}个公休日</p>
        </a>
      ))}
    </div>

    <h2 class="text-lg font-semibold text-gray-900 mt-6">数据来源</h2>
    <p>
      假期数据来源于各国政府官方网站发布的公告。我们每年会检查并更新数据。
      如果您发现任何错误，欢迎通过 GitHub Issues 反馈。
    </p>
    <ul class="list-disc pl-5 space-y-1 text-sm">
      {countries.map((c) => (
        <li>
          {c.flag} {c.name} — <a href={c.sourceUrl} target="_blank" rel="noopener" class="text-blue-600 hover:underline">{c.sourceLabel}</a>
        </li>
      ))}
    </ul>

    <h2 class="text-lg font-semibold text-gray-900 mt-6">功能</h2>
    <ul class="list-disc pl-5 space-y-1 text-sm">
      <li>📥 <strong>iCal 日历订阅</strong>：下载 .ics 文件导入 iPhone、Android、Google Calendar 等</li>
      <li>🖨️ <strong>精美打印</strong>：优化的打印版式，A4 纸打印效果最佳</li>
      <li>📱 <strong>响应式设计</strong>：手机、平板、电脑均可流畅使用</li>
      <li>🆓 <strong>完全免费</strong>：无需注册、无需付费</li>
    </ul>
  </div>
</BaseLayout>
```

- [ ] **Step 2: 创建 src/pages/subscribe.astro**

```astro
---
// src/pages/subscribe.astro
import BaseLayout from '../components/BaseLayout.astro';
---

<BaseLayout
  title="日历订阅指南"
  description="如何将假期日历导入到您的 iPhone、Android 或 Google Calendar 中。"
  canonicalUrl="https://holiday-calendar.pages.dev/subscribe/"
>
  <h1 class="text-2xl font-bold text-gray-900 mb-6">📥 日历订阅指南</h1>

  <div class="space-y-8 text-gray-700">
    <section>
      <h2 class="text-lg font-semibold text-gray-900 mb-2">如何使用？</h2>
      <ol class="list-decimal pl-5 space-y-2 text-sm">
        <li>在任意国家假期页点击「📥 导入日历」按钮</li>
        <li>浏览器会下载一个 <code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.ics</code> 文件</li>
        <li>点击下载的文件，系统会自动打开日历应用</li>
        <li>在弹出的对话框中确认添加即可</li>
      </ol>
    </section>

    <section>
      <h2 class="text-lg font-semibold text-gray-900 mb-2">各平台详细说明</h2>

      <h3 class="font-medium text-gray-800 mt-4">iPhone / iPad</h3>
      <p class="text-sm">下载 .ics 文件后 → 点击文件 → 系统日历自动打开 → 点「添加全部」→ 完成</p>

      <h3 class="font-medium text-gray-800 mt-4">Android</h3>
      <p class="text-sm">下载 .ics 文件 → 打开 Google 日历 → 设置 → 导入 → 选择文件 → 导入</p>

      <h3 class="font-medium text-gray-800 mt-4">Google Calendar (网页版)</h3>
      <p class="text-sm">下载 .ics 文件 → 打开 calendar.google.com → 设置(齿轮) → 导入和导出 → 选择文件 → 导入</p>

      <h3 class="font-medium text-gray-800 mt-4">Outlook Calendar</h3>
      <p class="text-sm">下载 .ics 文件 → 打开 Outlook → 文件 → 打开和导出 → 导入/导出 → 导入 iCalendar 文件</p>
    </section>

    <section>
      <h2 class="text-lg font-semibold text-gray-900 mb-2">温馨提示</h2>
      <ul class="list-disc pl-5 space-y-1 text-sm">
        <li>每个 .ics 文件包含一个完整年份的假期数据</li>
        <li>假期事件设置了提前 15 小时的通知提醒</li>
        <li>假期日期以"全天事件"形式添加，不会占用具体时间段</li>
        <li>建议年初导入当年日历，年底更新下一年的</li>
      </ul>
    </section>
  </div>
</BaseLayout>
```

- [ ] **Step 3: 验证**

```bash
npx astro build
```
期望：生成 `/about/` 和 `/subscribe/` 页面。

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: add about and subscribe pages"
```

---

### Task 18: Google Analytics 集成

**Files:**
- Modify: `src/components/BaseLayout.astro:16-16`

- [ ] **Step 1: 在 BaseLayout.astro 的 `<head>` 中添加 GA 脚本**

在 `src/components/BaseLayout.astro` 的 `</head>` 之前，替换 TODO 注释为：

```astro
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    </script>
```

注：`G-XXXXXXXXXX` 为占位符，实际部署时替换为真实的 GA4 测量 ID。

- [ ] **Step 2: 验证构建**

```bash
npx astro build
```
期望：所有页面的 head 中包含 GA 脚本。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add Google Analytics integration"
```

---

### Task 19: 响应式美术调整

**Files:**
- Modify: `src/components/Calendar.astro`, `src/pages/index.astro`

- [ ] **Step 1: 调整移动端日历列数**

确认 `Calendar.astro` 中已使用 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`（Task 10 已包含）。无需额外修改。

- [ ] **Step 2: 调整首页卡片移动端为单列**

确认 `index.astro` 中已使用 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`（Task 12 已包含）。无需额外修改。

- [ ] **Step 3: 确保国家页标题在移动端竖向排列**

确认 `[country]/[year].astro` 中 header 部分使用 `flex-col sm:flex-row`（Task 13 已包含）。

- [ ] **Step 4: 验证三个断点下的表现**

```bash
npx astro build && npx astro preview
```

在浏览器中切换到 375px / 768px / 1280px 三个宽度，检查：
- 首页卡片列数正确切换
- 日历网格列数正确切换
- 按钮不离谱变形
- 文字不溢出

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "style: responsive design polish for all breakpoints"
```

---

### Task 20: Cloudflare Pages 部署配置

**Files:**
- Create: `wrangler.toml` (optional), 无必需配置文件

- [ ] **Step 1: 在 GitHub 创建仓库**

1. 访问 github.com，创建新仓库：`holiday-calendar`
2. 不要勾选 "Initialize with README"（已有内容）

- [ ] **Step 2: 推送代码到 GitHub**

```bash
cd "D:/My Doc/website code/holiday-calendar"
git remote add origin https://github.com/<your-username>/holiday-calendar.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: 在 Cloudflare Pages 创建项目**

1. 登录 Cloudflare Dashboard → Workers & Pages → Pages
2. 点击 "连接到 Git" → 选择 `holiday-calendar` 仓库
3. 构建设置：
   - **框架预设**：Astro
   - **构建命令**：`npm run build`
   - **输出目录**：`dist`
4. 点击 "保存并部署"

- [ ] **Step 4: 验证部署**

部署完成后访问 `https://holiday-calendar.pages.dev`，确认首页可以正常访问，所有链接可用。

- [ ] **Step 5: 最终验收清单**

- [ ] 首页显示 3 个国家卡片 + 1 个占位卡片
- [ ] `/cn/` 重定向到 `/cn/2026/`
- [ ] `/us/2026/` 显示美国 2026 日历
- [ ] `/de/2026/` 显示德国 2026 日历
- [ ] 年份标签可在 2025/2026/2027 之间切换
- [ ] `/ics/cn-2026.ics` 下载 iCal 文件
- [ ] `/print/cn/2026/` 打开打印页并自动弹出打印对话框
- [ ] `/about/` 和 `/subscribe/` 正常显示
- [ ] 404 页面对无效路由正常展示
- [ ] 移动端 (375px) 布局正常
- [ ] Google Analytics 脚本已嵌入
- [ ] Lighthouse 性能评分 ≥ 90

- [ ] **Step 6: 提交最终版本**

```bash
git add -A && git commit -m "chore: add Cloudflare Pages deployment config"
git push
```

---

