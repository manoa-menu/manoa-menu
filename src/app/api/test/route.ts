import { NextResponse } from 'next/server';

export default async function GET(request: Request) {
  return NextResponse.json({ error: `Testing: ${request}` }, { status: 200 });
}
