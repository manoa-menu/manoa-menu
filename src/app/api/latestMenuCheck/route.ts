import { NextRequest, NextResponse } from 'next/server';
import { getLatestCCMenu } from '@/lib/dbActions';
import { foodTableCCMenu } from '@/lib/foodTable';

// eslint-disable-next-line import/prefer-default-export
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'English';

  try {
    const latestMenu = await getLatestCCMenu(language);

    if (!latestMenu) {
      return new Response('No menu found', { status: 404 });
    }

    await foodTableCCMenu(latestMenu.id);
    return NextResponse.json(latestMenu);
  } catch (error) {
    console.error('Error fetching latest menu:', error);
    return new Response('Error fetching latest menu', { status: 500 });
  }
}
