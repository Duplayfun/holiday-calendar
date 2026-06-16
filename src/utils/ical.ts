// src/utils/ical.ts
import type { CountryData } from '../types';

function formatICalDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const y2 = date.getFullYear();
  const m2 = String(date.getMonth() + 1).padStart(2, '0');
  const d2 = String(date.getDate()).padStart(2, '0');
  return `${y2}-${m2}-${d2}`;
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

    // DTEND is exclusive in iCal: date + days_off (or 1 for single-day events)
    const dtEnd = formatICalDate(addDays(holiday.date, holiday.daysOff || 1));

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
