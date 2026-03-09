import { NextResponse } from 'next/server';
import { scrapeCCHours } from '@/lib/scrapeCCUrl';

const CC_URL = 'https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court';

export async function GET() {
  try {
    const hours = await scrapeCCHours(CC_URL);
    return NextResponse.json({ hours: hours ?? null });
  } catch (error) {
    console.error('Error scraping CC hours:', error);
    return NextResponse.json({ hours: null });
  }
}

export const maxDuration = 30;
