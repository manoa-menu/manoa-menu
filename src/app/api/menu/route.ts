import { NextRequest, NextResponse } from 'next/server';
import getCheckCCMenu from '@/lib/menuActions';

// eslint-disable-next-line import/prefer-default-export
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const language = searchParams.get('language') || 'English';

  try {
    const menu = await getCheckCCMenu(language);
    return NextResponse.json(menu);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
