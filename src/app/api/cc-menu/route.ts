import { NextRequest, NextResponse } from 'next/server';

import getCheckCCMenu from '@/lib/menuActions';
import { parseMenuLanguage } from '@/lib/menuQuery';
import { allowMenuRequest, menuClientKey } from '@/lib/menuRateLimit';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const language = parseMenuLanguage(searchParams.get('language') || 'English');
  if (!language) {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
  }
  if (!allowMenuRequest(`cc-menu:${menuClientKey(req)}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const start = performance.now();

  try {
    const menu = await getCheckCCMenu(language);
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    console.log(`[cc-menu] Done in ${elapsed}s (language=${language})`);
    return NextResponse.json(menu, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    console.error(`[cc-menu] Error after ${elapsed}s:`, error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

export const maxDuration = 180;
export const dynamic = 'force-dynamic';
