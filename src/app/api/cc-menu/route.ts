import { NextRequest, NextResponse } from 'next/server';
import getCheckCCMenu from '@/lib/menuActions';

 
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const language = searchParams.get('language') || 'English';
  const start = performance.now();

  try {
    const menu = await getCheckCCMenu(language);
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    console.log(`[cc-menu] Done in ${elapsed}s (language=${language})`);
    return NextResponse.json(menu);
  } catch (error) {
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    if (error instanceof TypeError) {
      console.error(`[cc-menu] TypeError after ${elapsed}s:`, error);
      return NextResponse.json({ error: 'Type error occurred while fetching the menu.' }, { status: 500 });
    } if (error instanceof SyntaxError) {
      console.error(`[cc-menu] SyntaxError after ${elapsed}s:`, error);
      return NextResponse.json({ error: 'Syntax error occurred while fetching the menu.' }, { status: 500 });
    }
    console.error(`[cc-menu] Error after ${elapsed}s:`, error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export const maxDuration = 60;
