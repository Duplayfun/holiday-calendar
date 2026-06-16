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
