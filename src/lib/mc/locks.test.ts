import { describe, it, expect } from 'vitest';
import { withLock } from './locks';

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

describe('withLock', () => {
  it('serializes concurrent calls with the same key', async () => {
    let active = 0;
    let maxConcurrent = 0;
    const order: number[] = [];

    const body = (n: number) => async () => {
      active += 1;
      maxConcurrent = Math.max(maxConcurrent, active);
      order.push(n);
      await tick(10);
      active -= 1;
    };

    await Promise.all([
      withLock('k', body(1)),
      withLock('k', body(2)),
      withLock('k', body(3))
    ]);

    expect(maxConcurrent).toBe(1);
    expect(order).toEqual([1, 2, 3]);
  });

  it('allows different keys to run concurrently', async () => {
    let active = 0;
    let maxConcurrent = 0;

    const body = async () => {
      active += 1;
      maxConcurrent = Math.max(maxConcurrent, active);
      await tick(10);
      active -= 1;
    };

    await Promise.all([withLock('a', body), withLock('b', body), withLock('c', body)]);

    expect(maxConcurrent).toBe(3);
  });

  it('releases the lock when the body throws', async () => {
    await expect(
      withLock('err', async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    let ran = false;
    await withLock('err', async () => {
      ran = true;
    });
    expect(ran).toBe(true);
  });

  it('does not let a later caller overtake while the holder is running', async () => {
    const events: string[] = [];

    const first = withLock('seq', async () => {
      events.push('first:start');
      await tick(30);
      events.push('first:end');
    });

    await tick(5);

    const second = withLock('seq', async () => {
      events.push('second:start');
    });

    await Promise.all([first, second]);

    expect(events).toEqual(['first:start', 'first:end', 'second:start']);
  });

  it('returns the body result', async () => {
    const v = await withLock('ret', async () => 42);
    expect(v).toBe(42);
  });
});
