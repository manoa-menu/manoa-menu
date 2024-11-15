import { NextResponse } from 'next/server';
import parseCampusCenterMenu from '@/lib/menuParse';

export default async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return NextResponse.json({ error: 'File name is required' }, { status: 400 });
  }

  try {
    const menu = await parseCampusCenterMenu(fileName);
    return NextResponse.json(menu, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
