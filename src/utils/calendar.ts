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
