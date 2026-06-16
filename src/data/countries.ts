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
