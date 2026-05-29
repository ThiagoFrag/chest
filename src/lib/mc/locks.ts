const locks = new Map<string, Promise<unknown>>();

/**
 * Serializes async executions that share the same `key`. Calls with the same
 * key run one at a time, in arrival order; calls with different keys run
 * concurrently. The lock is always released, even if `fn` throws.
 *
 * The next link in the chain is stored synchronously, before awaiting the
 * previous one, so two concurrent callers can never both observe a free slot
 * and proceed in parallel.
 */
export async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();

  const run = prev.then(() => fn());
  // Store a non-throwing tail so the next waiter chains regardless of outcome.
  const tail = run.then(
    () => undefined,
    () => undefined
  );
  locks.set(key, tail);

  try {
    return await run;
  } finally {
    if (locks.get(key) === tail) locks.delete(key);
  }
}

/** Stable key for serializing all server-creation critical sections. */
export const SERVER_CREATE_LOCK = 'server-create';
