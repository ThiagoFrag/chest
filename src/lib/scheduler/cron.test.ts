import { describe, it, expect } from 'vitest';
import { parseCron, matches, nextRunAt } from './cron';

describe('parseCron', () => {
  it('parses standard 5-field cron', () => {
    const c = parseCron('0 4 * * *');
    expect(c.minute).toEqual(new Set([0]));
    expect(c.hour).toEqual(new Set([4]));
  });

  it('parses comma-separated values', () => {
    const c = parseCron('0,15,30,45 * * * *');
    expect(c.minute).toEqual(new Set([0, 15, 30, 45]));
  });

  it('parses ranges', () => {
    const c = parseCron('* 9-17 * * *');
    expect(c.hour).toEqual(new Set([9, 10, 11, 12, 13, 14, 15, 16, 17]));
  });

  it('parses step values */N', () => {
    const c = parseCron('*/15 * * * *');
    expect(c.minute).toEqual(new Set([0, 15, 30, 45]));
  });

  it('throws on invalid expressions', () => {
    expect(() => parseCron('bad')).toThrow();
    expect(() => parseCron('* * *')).toThrow();
  });
});

describe('matches', () => {
  it('matches when all fields align', () => {
    const c = parseCron('30 14 * * *');
    const d = new Date('2026-05-29T14:30:00Z');
    expect(matches(c, d)).toBe(true);
  });

  it('rejects when minute differs', () => {
    const c = parseCron('30 14 * * *');
    const d = new Date('2026-05-29T14:31:00Z');
    expect(matches(c, d)).toBe(false);
  });

  it('matches midnight pattern 0 0 * * *', () => {
    const c = parseCron('0 0 * * *');
    expect(matches(c, new Date('2026-05-29T00:00:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-05-29T00:01:00Z'))).toBe(false);
    expect(matches(c, new Date('2026-05-29T23:59:00Z'))).toBe(false);
  });

  it('matches step minutes */5', () => {
    const c = parseCron('*/5 * * * *');
    expect(matches(c, new Date('2026-05-29T10:00:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-05-29T10:05:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-05-29T10:55:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-05-29T10:03:00Z'))).toBe(false);
  });

  it('matches hour range 9-17', () => {
    const c = parseCron('0 9-17 * * *');
    expect(matches(c, new Date('2026-05-29T09:00:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-05-29T17:00:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-05-29T08:00:00Z'))).toBe(false);
    expect(matches(c, new Date('2026-05-29T18:00:00Z'))).toBe(false);
  });

  it('matches minute list 1,15', () => {
    const c = parseCron('1,15 * * * *');
    expect(matches(c, new Date('2026-05-29T10:01:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-05-29T10:15:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-05-29T10:02:00Z'))).toBe(false);
  });

  it('matches every-minute wildcard * * * * *', () => {
    const c = parseCron('* * * * *');
    expect(matches(c, new Date('2026-05-29T00:00:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-12-31T23:59:00Z'))).toBe(true);
  });

  it('matches specific day-of-month at end of month (31)', () => {
    const c = parseCron('0 3 31 * *');
    expect(matches(c, new Date('2026-05-31T03:00:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-05-30T03:00:00Z'))).toBe(false);
  });

  it('matches specific month', () => {
    const c = parseCron('0 0 1 1 *');
    expect(matches(c, new Date('2026-01-01T00:00:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-02-01T00:00:00Z'))).toBe(false);
  });

  it('matches day-of-week (weeklySunday)', () => {
    // 2026-05-31 is a Sunday (UTC)
    const c = parseCron('0 3 * * 0');
    expect(matches(c, new Date('2026-05-31T03:00:00Z'))).toBe(true);
    expect(matches(c, new Date('2026-05-29T03:00:00Z'))).toBe(false);
  });

  it('uses OR semantics when both DOM and DOW restricted', () => {
    // POSIX: when both day-of-month AND day-of-week are restricted, match either.
    const c = parseCron('0 0 15 * 0');
    // 2026-05-15 is the 15th (DOM match), a Friday
    expect(matches(c, new Date('2026-05-15T00:00:00Z'))).toBe(true);
    // 2026-05-31 is a Sunday (DOW match), not the 15th
    expect(matches(c, new Date('2026-05-31T00:00:00Z'))).toBe(true);
    // 2026-05-20 is neither the 15th nor a Sunday (Wednesday)
    expect(matches(c, new Date('2026-05-20T00:00:00Z'))).toBe(false);
  });

  it('is timezone-independent for a UTC date regardless of process.env.TZ', () => {
    const original = process.env.TZ;
    process.env.TZ = 'America/Sao_Paulo';
    try {
      const c = parseCron('30 14 * * *');
      expect(matches(c, new Date('2026-05-29T14:30:00Z'))).toBe(true);
    } finally {
      process.env.TZ = original;
    }
  });
});

describe('nextRunAt', () => {
  it('returns next minute match', () => {
    const from = new Date('2026-05-29T14:30:00Z');
    const next = nextRunAt('0 * * * *', from);
    expect(next?.getUTCHours()).toBe(15);
    expect(next?.getUTCMinutes()).toBe(0);
  });

  it('returns a future date for every-minute pattern', () => {
    const result = nextRunAt('* * * * *', new Date());
    expect(result).toBeInstanceOf(Date);
  });

  it('finds next daily 3am run in UTC', () => {
    const from = new Date('2026-05-29T14:30:00Z');
    const next = nextRunAt('0 3 * * *', from);
    expect(next?.getUTCFullYear()).toBe(2026);
    expect(next?.getUTCMonth()).toBe(4); // May (0-indexed)
    expect(next?.getUTCDate()).toBe(30);
    expect(next?.getUTCHours()).toBe(3);
    expect(next?.getUTCMinutes()).toBe(0);
  });

  it('finds next */5 step run', () => {
    const from = new Date('2026-05-29T14:31:00Z');
    const next = nextRunAt('*/5 * * * *', from);
    expect(next?.getUTCHours()).toBe(14);
    expect(next?.getUTCMinutes()).toBe(35);
  });

  it('rolls over to next month for day-of-month 1', () => {
    const from = new Date('2026-05-29T14:30:00Z');
    const next = nextRunAt('0 0 1 * *', from);
    expect(next?.getUTCMonth()).toBe(5); // June
    expect(next?.getUTCDate()).toBe(1);
    expect(next?.getUTCHours()).toBe(0);
  });
});
