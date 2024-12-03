import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { SodexoRootObject } from '@/types/menuTypes';

const now = new Date();
const formattedDate = now.toISOString().split('T')[0];

// eslint-disable-next-line import/prefer-default-export
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const date = searchParams.get('date') || formattedDate;
  const language = searchParams.get('language') || 'English';
  const location = searchParams.get('location') || '';

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Expected yyyy-mm-dd' }, { status: 400 });
  }
  const url = process.env.GW_API_URL;
  const apiKey = process.env.MMR_API_KEY;

  if (!url || !apiKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const queryUrl = `${url}?date=${date}`;

  const headers = {
    'API-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const response = await axios.get(queryUrl, { headers });
    // eslint-disable-next-line prefer-destructuring
    const data: SodexoRootObject = response.data;
    return NextResponse.json(data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data || error.message },
        { status: error.response?.status || 500 },
      );
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
