import { NextRequest, NextResponse } from 'next/server';

import {
  getTranslationReviewRow,
  listTranslationReviews,
  parseTranslationKind,
  parseTranslationLanguage,
  parseTranslationLocation,
  parseTranslationSort,
  parseTranslationStatus,
  resetTranslationToAi,
  saveTranslationCorrection,
} from '@/lib/translationReview';
import { ensureSdxTranslationCacheBackfilled } from '@/lib/sdxTranslationCache';
import {
  TRANSLATION_REVIEW_COOKIE,
  getReviewerByToken,
  reviewerCanAccessLanguage,
} from '@/lib/translationReviewers';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: 'You cannot edit this language' }, { status: 403 });
}

function getReviewerFromRequest(req: NextRequest) {
  const cookieToken = req.cookies.get(TRANSLATION_REVIEW_COOKIE)?.value;
  const queryToken = req.nextUrl.searchParams.get('key');
  return getReviewerByToken(cookieToken) ?? getReviewerByToken(queryToken);
}

export async function GET(req: NextRequest) {
  const reviewer = getReviewerFromRequest(req);
  if (!reviewer) {
    return unauthorized();
  }

  const language = parseTranslationLanguage(req.nextUrl.searchParams.get('language'));
  if (!language) {
    return NextResponse.json({ error: 'Invalid or missing language' }, { status: 400 });
  }
  if (!reviewerCanAccessLanguage(reviewer, language)) {
    return forbidden();
  }

  const page = Number.parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10);
  const query = req.nextUrl.searchParams.get('q') ?? '';
  const status = parseTranslationStatus(req.nextUrl.searchParams.get('status'));
  const kind = parseTranslationKind(req.nextUrl.searchParams.get('kind'));
  const location = parseTranslationLocation(req.nextUrl.searchParams.get('location'));
  const sort = parseTranslationSort(req.nextUrl.searchParams.get('sort'));

  await ensureSdxTranslationCacheBackfilled(language);

  const result = await listTranslationReviews({
    language,
    status,
    kind,
    location,
    sort,
    query,
    page: Number.isFinite(page) ? page : 1,
  });

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function PATCH(req: NextRequest) {
  const reviewer = getReviewerFromRequest(req);
  if (!reviewer) {
    return unauthorized();
  }

  let body: {
    id?: number;
    translatedText?: string;
    resetToAi?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid translation id' }, { status: 400 });
  }

  const existing = await getTranslationReviewRow(id);
  if (!existing) {
    return NextResponse.json({ error: 'Translation not found.' }, { status: 404 });
  }
  if (!reviewerCanAccessLanguage(reviewer, existing.language)) {
    return forbidden();
  }

  try {
    if (body.resetToAi) {
      const row = await resetTranslationToAi(id);
      return NextResponse.json(row);
    }

    if (typeof body.translatedText !== 'string') {
      return NextResponse.json({ error: 'translatedText is required' }, { status: 400 });
    }

    const row = await saveTranslationCorrection({
      id,
      translatedText: body.translatedText,
      correctedBy: reviewer.name,
    });
    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save translation';
    const status = message === 'Translation not found.' ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
