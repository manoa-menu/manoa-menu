import { NextResponse } from 'next/server';
import { getFoodTable } from '@/lib/foodTable';

// eslint-disable-next-line import/prefer-default-export
export async function GET() {
  try {
    const foodTable = await getFoodTable();

    if (!foodTable) {
      return new Response('No food table found', { status: 404 });
    }
    return NextResponse.json(foodTable);
  } catch (error) {
    console.error('Error fetching food table:', error);
    return new Response('Error fetching food table', { status: 500 });
  }
}
