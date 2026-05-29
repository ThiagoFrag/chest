/**
 * Wrappers para tratar "best-effort" / "ignore-failure" operations com logging,
 * ao invés do anti-pattern .catch(() => undefined) que esconde bugs.
 */

export function silent<T>(p: Promise<T>, label?: string): Promise<T | undefined> {
  return p.catch((err) => {
    if (process.env.CHEST_LOG_SILENT === "true") {
      console.warn(`[silent${label ? ":" + label : ""}]`, err instanceof Error ? err.message : err);
    }
    return undefined;
  });
}

export function silentSync<T>(fn: () => T, label?: string): T | undefined {
  try {
    return fn();
  } catch (err) {
    if (process.env.CHEST_LOG_SILENT === "true") {
      console.warn(`[silent-sync${label ? ":" + label : ""}]`, err instanceof Error ? err.message : err);
    }
    return undefined;
  }
}

export function logFail<T>(p: Promise<T>, label: string): Promise<T | undefined> {
  return p.catch((err) => {
    console.error(`[${label}] failed:`, err instanceof Error ? err.message : err);
    return undefined;
  });
}
