import { timingSafeEqual } from 'node:crypto';

export function isAiDashAuthorized(providedKey: string | null | undefined): boolean {
  const expected = process.env.AI_DASH;
  if (!expected || !providedKey) {
    return false;
  }

  const left = Buffer.from(expected);
  const right = Buffer.from(providedKey);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}
