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
    if (language !== 'English') {
      try {
        const english = await getCheckCCMenu('English');
        if (english.length) {
          return NextResponse.json(english, {
            headers: { 'Cache-Control': 'no-store', 'X-Menu-Language': 'English' },
          });
        }
      } catch {
        console.warn('[cc-menu] English fallback also unavailable');
      }
    }
    return NextResponse.json({ error: 'Menu is temporarily unavailable' }, { status: 503 });
  }
}

export const maxDuration = 180;
export const dynamic = 'force-dynamic';
