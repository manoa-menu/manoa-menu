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
    if (error instanceof TypeError) {
      console.error('TypeError fetching menu:', error);
      return NextResponse.json({ error: 'Type error occurred while fetching the menu.' }, { status: 500 });
    } if (error instanceof SyntaxError) {
      console.error('SyntaxError fetching menu:', error);
      return NextResponse.json({ error: 'Syntax error occurred while fetching the menu.' }, { status: 500 });
    }
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
