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
});
