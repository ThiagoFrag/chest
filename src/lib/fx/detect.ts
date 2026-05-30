export const DEFAULT_MOTION = true;

export function pickMotion(cookieValue: string | null | undefined): boolean {
  if (cookieValue === '1') return true;
  if (cookieValue === '0') return false;
  return DEFAULT_MOTION;
}
