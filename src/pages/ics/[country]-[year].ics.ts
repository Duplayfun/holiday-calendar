// src/pages/ics/[country]-[year].ics.ts
import type { APIRoute } from 'astro';
import { generateICS } from '../../utils/ical';
import { countries, availableYears } from '../../data/countries';
import type { CountryData } from '../../types';

export function getStaticPaths() {
  const paths: { params: { country: string; year: string } }[] = [];
  for (const c of countries) {
    for (const year of availableYears) {
      paths.push({ params: { country: c.code, year: String(year) } });
    }
  }
  return paths;
}

export const GET: APIRoute = async ({ params }) => {
  const { country, year } = params;

  if (!country || !year) {
    return new Response('Not Found', { status: 404 });
  }

  // Validate country
  if (!countries.some((c) => c.code === country)) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const data: CountryData = (await import(`../../data/${country}/${year}.json`)).default;
    const icsContent = generateICS(data);

    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${country}-${year}.ics"`,
      },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
};
