/**
 * Cron parser leve.
 * Suporta sintaxe básica: minute hour day month dayOfWeek
 * Suporta: *, números, ranges (a-b), lists (a,b,c), steps (* /n)
 * Ignora day-of-week se day-of-month for setado (semantic POSIX).
 *
 * Matching opera em UTC (getUTC*). Datas passadas pro matcher/nextRunAt
 * são interpretadas em UTC, consistente com o resto do scheduler.
 */

export interface ParsedCron {
  minute: Set<number>;
  hour: Set<number>;
  dayOfMonth: Set<number>;
  month: Set<number>;
  dayOfWeek: Set<number>;
  raw: string;
}

const ranges = {
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 6]
} as const;

export function parseCron(expr: string): ParsedCron {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`cron precisa de 5 campos, got ${parts.length}`);
  }
  const [m, h, dom, mon, dow] = parts;
  return {
    minute: parseField(m, ranges.minute[0], ranges.minute[1]),
    hour: parseField(h, ranges.hour[0], ranges.hour[1]),
    dayOfMonth: parseField(dom, ranges.dayOfMonth[0], ranges.dayOfMonth[1]),
    month: parseField(mon, ranges.month[0], ranges.month[1]),
    dayOfWeek: parseField(dow, ranges.dayOfWeek[0], ranges.dayOfWeek[1]),
    raw: expr
  };
}

function parseField(s: string, min: number, max: number): Set<number> {
  const out = new Set<number>();
  for (const item of s.split(',')) {
    if (item === '*') {
      for (let i = min; i <= max; i++) out.add(i);
    } else if (item.startsWith('*/')) {
      const step = Number(item.slice(2));
      if (!Number.isInteger(step) || step <= 0) throw new Error(`step inválido: ${item}`);
      for (let i = min; i <= max; i += step) out.add(i);
    } else if (item.includes('-')) {
      const [a, b] = item.split('-').map(Number);
      if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error(`range inválido: ${item}`);
      for (let i = a; i <= b; i++) out.add(i);
    } else {
      const n = Number(item);
      if (!Number.isInteger(n) || n < min || n > max) throw new Error(`valor fora do range: ${item}`);
      out.add(n);
    }
  }
  return out;
}

export function matches(cron: ParsedCron, date: Date): boolean {
  const minute = date.getUTCMinutes();
  const hour = date.getUTCHours();
  const dom = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const dow = date.getUTCDay();

  if (!cron.minute.has(minute)) return false;
  if (!cron.hour.has(hour)) return false;
  if (!cron.month.has(month)) return false;

  const domMatch = cron.dayOfMonth.has(dom);
  const dowMatch = cron.dayOfWeek.has(dow);

  const domRestricted = cron.dayOfMonth.size !== 31;
  const dowRestricted = cron.dayOfWeek.size !== 7;

  if (domRestricted && dowRestricted) return domMatch || dowMatch;
  if (domRestricted) return domMatch;
  if (dowRestricted) return dowMatch;
  return true;
}

export function nextRunAt(expr: string, from: Date = new Date()): Date | null {
  const cron = parseCron(expr);
  const next = new Date(from);
  next.setUTCSeconds(0, 0);
  next.setUTCMinutes(next.getUTCMinutes() + 1);
  for (let i = 0; i < 366 * 24 * 60; i++) {
    if (matches(cron, next)) return next;
    next.setUTCMinutes(next.getUTCMinutes() + 1);
  }
  return null;
}

export const PRESETS: Record<string, { label: string; cron: string }> = {
  hourly: { label: 'a cada hora', cron: '0 * * * *' },
  every6h: { label: 'a cada 6 horas', cron: '0 */6 * * *' },
  every12h: { label: 'a cada 12 horas', cron: '0 */12 * * *' },
  daily3am: { label: 'diário às 3am', cron: '0 3 * * *' },
  daily4am: { label: 'diário às 4am', cron: '0 4 * * *' },
  daily6am: { label: 'diário às 6am', cron: '0 6 * * *' },
  weeklySunday3am: { label: 'domingo às 3am', cron: '0 3 * * 0' }
};
