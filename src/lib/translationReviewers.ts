import { createHash, timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto';

import {
  TRANSLATION_REVIEW_LANGUAGES,
  type TranslationReviewLanguage,
  type TranslationReviewerPublic,
} from '@/lib/translationReviewShared';

export const TRANSLATION_REVIEW_COOKIE = 'mm_translation_review';
export const TRANSLATION_REVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export type TranslationReviewer = {
  name: string;
  languages: TranslationReviewLanguage[];
  token: string;
};

export type { TranslationReviewerPublic };

const REVIEWER_DEFS = [
  {
    name: 'Justin',
    envVar: 'TRANSLATION_REVIEW_JUSTIN',
    languages: ['Japanese', 'Korean', 'Chinese'],
  },
  {
    name: 'Youjin',
    envVar: 'TRANSLATION_REVIEW_YOUJIN',
    languages: ['Korean'],
  },
  {
    name: 'Matthew',
    envVar: 'TRANSLATION_REVIEW_MATTHEW',
    languages: ['Korean'],
  },
  {
    name: 'Max',
    envVar: 'TRANSLATION_REVIEW_MAX',
    languages: ['Chinese'],
  },
] as const satisfies ReadonlyArray<{
  name: string;
  envVar: string;
  languages: readonly TranslationReviewLanguage[];
}>;

function tokenEquals(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  if (leftBuf.length !== rightBuf.length) {
    cryptoTimingSafeEqual(leftBuf, leftBuf);
    return false;
  }
  return cryptoTimingSafeEqual(leftBuf, rightBuf);
}

export function getConfiguredReviewers(
  env: Record<string, string | undefined> = process.env,
): TranslationReviewer[] {
  return REVIEWER_DEFS.flatMap((def) => {
    const token = env[def.envVar]?.trim();
    if (!token) {
      return [];
    }
    return [{
      name: def.name,
      languages: [...def.languages],
      token,
    }];
  });
}

export function getReviewerByToken(
  token: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): TranslationReviewer | null {
  if (!token) {
    return null;
  }

  let match: TranslationReviewer | null = null;
  getConfiguredReviewers(env).forEach((reviewer) => {
    if (tokenEquals(token, reviewer.token)) {
      match = reviewer;
    }
  });
  return match;
}

export function toPublicReviewer(reviewer: TranslationReviewer): TranslationReviewerPublic {
  return {
    name: reviewer.name,
    languages: reviewer.languages,
  };
}

export function reviewerCanAccessLanguage(
  reviewer: TranslationReviewerPublic,
  language: string,
): boolean {
  return reviewer.languages.includes(language as TranslationReviewLanguage);
}

export function defaultReviewerLanguage(
  reviewer: TranslationReviewerPublic,
): TranslationReviewLanguage {
  return reviewer.languages[0] ?? TRANSLATION_REVIEW_LANGUAGES[0];
}

export function translationReviewCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TRANSLATION_REVIEW_COOKIE_MAX_AGE,
  };
}

/** Opaque fingerprint for logs — never log the raw token. */
export function reviewerTokenFingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 8);
}
