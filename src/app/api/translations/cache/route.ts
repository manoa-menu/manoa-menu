import { NextRequest, NextResponse } from 'next/server';

import {
  listTranslationCacheWeeks,
  parseTranslationCachePurgeScope,
  purgeTranslationCache,
} from '@/lib/translationCachePurge';
import {
  TRANSLATION_REVIEW_COOKIE,
  getReviewerByToken,
} from '@/lib/translationReviewers';

export const dynamic = 'force-dynamic';

function getJustinFromRequest(req: NextRequest) {
  const cookieToken = req.cookies.get(TRANSLATION_REVIEW_COOKIE)?.value;
  const queryToken = req.nextUrl.searchParams.get('key');
  const reviewer = getReviewerByToken(cookieToken) ?? getReviewerByToken(queryToken);
  return reviewer?.name === 'Justin' ? reviewer : null;
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!getJustinFromRequest(req)) {
    return unauthorized();
  }

  const weeks = await listTranslationCacheWeeks();
  return NextResponse.json({ weeks }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function DELETE(req: NextRequest) {
  if (!getJustinFromRequest(req)) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const scope = parseTranslationCachePurgeScope(body);
  if (!scope) {
    return NextResponse.json(
      { error: 'Choose a valid week, at least one menu, and at least one language.' },
      { status: 400 },
    );
  }

  try {
    const result = await purgeTranslationCache(scope);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[translation cache] Purge failed', error);
    return NextResponse.json({ error: 'Could not purge the selected cache.' }, { status: 500 });
  }
}
