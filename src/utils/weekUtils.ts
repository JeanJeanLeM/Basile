import { Week } from '../types';
import { getMonthsInRange } from './dateUtils';

/**
 * Calcule le numéro de semaine ISO (1-52) depuis une date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Retourne les dates de début et fin d'une semaine donnée
 */
export function getWeekDates(weekNumber: number, year: number): { start: Date; end: Date } {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  
  const start = new Date(ISOweekStart);
  const end = new Date(ISOweekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Calcule la semaine de semis depuis la semaine de plantation
 * Gère le dépassement d'année (semaine 52 → semaine 1)
 */
export function calculateSowingWeek(plantingWeek: number, weeksBetween: number): number {
  let sowingWeek = plantingWeek - weeksBetween;
  
  // Gérer le dépassement d'année
  if (sowingWeek < 1) {
    sowingWeek = 52 + sowingWeek; // Semaine de l'année précédente
  }
  
  return sowingWeek;
}

/**
 * Génère toutes les semaines de l'année
 */
export function getWeeksForYear(year: number): Week[] {
  const weeks: Week[] = [];
  
  for (let weekNum = 1; weekNum <= 52; weekNum++) {
    const { start, end } = getWeekDates(weekNum, year);
    const month = start.getMonth() + 1; // 1-12
    
    weeks.push({
      number: weekNum,
      startDate: start,
      endDate: end,
      month,
      year,
    });
  }
  
  return weeks;
}

/**
 * Vérifie si une semaine est la semaine courante
 */
export function isCurrentWeek(weekNumber: number): boolean {
  const currentWeek = getWeekNumber(new Date());
  const currentYear = new Date().getFullYear();
  const weekDatesResult = getWeekDates(weekNumber, currentYear);
  const weekYear = weekDatesResult.start.getFullYear();

  return weekNumber === currentWeek && weekYear === currentYear;
}

/**
 * Retourne le mois (1-12) depuis un numéro de semaine
 */
export function getMonthFromWeek(weekNumber: number, year: number): number {
  const { start } = getWeekDates(weekNumber, year);
  return start.getMonth() + 1; // 1-12
}

/**
 * Formate une date en français (DD/MM/YYYY)
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formate une plage de dates de semaine
 */
export function formatWeekRange(start: Date, end: Date): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Normalise une liste de semaines (1-52) triée et dédupliquée
 */
export function normalizeWeeks(weeks: number[]): number[] {
  return [...new Set(weeks)]
    .filter((week) => week >= 1 && week <= 52)
    .sort((a, b) => a - b);
}

/**
 * Retourne les mois actifs à partir d'une liste de semaines
 */
export function getMonthsFromWeeks(weeks: number[], year: number): number[] {
  const normalized = normalizeWeeks(weeks);
  const months = normalized.map((week) => getMonthFromWeek(week, year));
  return [...new Set(months)].sort((a, b) => a - b);
}

/**
 * Formate une liste de semaines en plages lisibles (ex: "S12-16, S36-40")
 */
export function formatWeekRanges(weeks: number[]): string {
  const normalized = normalizeWeeks(weeks);
  if (normalized.length === 0) return '—';

  const ranges: Array<[number, number]> = [];
  let start = normalized[0];
  let prev = normalized[0];

  for (let i = 1; i < normalized.length; i++) {
    const current = normalized[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    ranges.push([start, prev]);
    start = current;
    prev = current;
  }
  ranges.push([start, prev]);

  return ranges
    .map(([rangeStart, rangeEnd]) =>
      rangeStart === rangeEnd ? `S${rangeStart}` : `S${rangeStart}-${rangeEnd}`
    )
    .join(', ');
}

/**
 * Retourne toutes les semaines d'une plage de mois
 */
export function getWeeksForMonthRange(
  startMonth: number,
  endMonth: number,
  year: number
): number[] {
  const months = getMonthsInRange(startMonth, endMonth);
  const weeks = getWeeksForYear(year)
    .filter((week) => months.includes(week.month))
    .map((week) => week.number);
  return normalizeWeeks(weeks);
}

const MONTH_ABBREV = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/**
 * Libellé pour tooltip : "Semaine 3 · 13–19 janv."
 */
export function getWeekTooltipLabel(weekNumber: number, year: number): string {
  const { start, end } = getWeekDates(weekNumber, year);
  const monthStart = start.getMonth();
  const monthEnd = end.getMonth();
  const dayStart = start.getDate();
  const dayEnd = end.getDate();
  const monthName = MONTH_ABBREV[monthStart];
  const monthNameEnd = monthStart !== monthEnd ? MONTH_ABBREV[monthEnd] : null;
  const range =
    monthNameEnd
      ? `${dayStart} ${monthName} – ${dayEnd} ${monthNameEnd}`
      : `${dayStart}–${dayEnd} ${monthName}`;
  return `Semaine ${weekNumber} · ${range}`;
}

/**
 * Détail des plages de semaines : uniquement les dates (pour tooltip au survol)
 * Ex: "2 mars – 26 avr.\n6 oct. – 1er déc."
 */
export function formatWeekRangesDetail(weeks: number[], year: number): string {
  const normalized = normalizeWeeks(weeks);
  if (normalized.length === 0) return '—';

  const ranges: Array<[number, number]> = [];
  let start = normalized[0];
  let prev = normalized[0];

  for (let i = 1; i < normalized.length; i++) {
    const current = normalized[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    ranges.push([start, prev]);
    start = current;
    prev = current;
  }
  ranges.push([start, prev]);

  const formatShort = (d: Date) => `${d.getDate()} ${MONTH_ABBREV[d.getMonth()]}`;

  return ranges
    .map(([rangeStart, rangeEnd]) => {
      const { start: startDate } = getWeekDates(rangeStart, year);
      const { end: endDate } = getWeekDates(rangeEnd, year);
      return `${formatShort(startDate)} – ${formatShort(endDate)}`;
    })
    .join('\n');
}
