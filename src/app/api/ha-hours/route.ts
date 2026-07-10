import { NextResponse } from 'next/server';
import { scrapeSdxLocationHours } from '@/lib/scrapeCCUrl';

const HA_URL = 'https://uhm.sodexomyway.com/en-us/locations/hale-aloha-cafe';

export async function GET() {
  try {
    const { hours, specialHours } = await scrapeSdxLocationHours(HA_URL);
    console.log(`[ha-hours] Status: ${hours}`);
    return NextResponse.json({ hours: hours ?? null, specialHours: specialHours ?? null });
  } catch (error) {
    console.error('Error scraping Hale Aloha hours:', error);
    return NextResponse.json({ hours: null, specialHours: null });
  }
}

export const maxDuration = 30;
