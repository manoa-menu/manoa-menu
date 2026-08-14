import { NextRequest, NextResponse } from 'next/server';

import {
  TRANSLATION_REVIEW_COOKIE,
  getReviewerByToken,
  translationReviewCookieOptions,
} from '@/lib/translationReviewers';
import { parseTranslationLanguage } from '@/lib/translationReviewShared';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  const reviewer = getReviewerByToken(key);
  if (!reviewer || !key) {
    return new NextResponse(null, { status: 404 });
  }

  const language = parseTranslationLanguage(req.nextUrl.searchParams.get('language'));
  const destination = req.nextUrl.clone();
  destination.pathname = '/translations';
  destination.search = '';
  if (language && reviewer.languages.includes(language)) {
    destination.searchParams.set('language', language);
  }

  const response = NextResponse.redirect(destination);
  response.cookies.set(TRANSLATION_REVIEW_COOKIE, key, translationReviewCookieOptions());
  return response;
}
