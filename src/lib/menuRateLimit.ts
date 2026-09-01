type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const MENU_RATE_LIMIT_WINDOW_MS = 60_000;
export const MENU_RATE_LIMIT_MAX = 30;

export function allowMenuRequest(
  key: string,
  now = Date.now(),
  max = MENU_RATE_LIMIT_MAX,
  windowMs = MENU_RATE_LIMIT_WINDOW_MS,
): boolean {
  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= max) {
    return false;
  }
  existing.count += 1;
  return true;
}

export function menuClientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Test-only: drop in-memory buckets. */
export function resetMenuRateLimit(): void {
  buckets.clear();
}
