import { NextResponse } from 'next/server';
import { scrapeSdxLocationHours } from '@/lib/scrapeCCUrl';

const GW_URL = 'https://uhm.sodexomyway.com/en-us/locations/gateway-cafe';

export async function GET() {
  try {
    const { hours, specialHours } = await scrapeSdxLocationHours(GW_URL);
    console.log(`[gw-hours] Status: ${hours}`);
    return NextResponse.json({ hours: hours ?? null, specialHours: specialHours ?? null });
  } catch (error) {
    console.error('Error scraping Gateway hours:', error);
    return NextResponse.json({ hours: null, specialHours: null });
  }
}

export const maxDuration = 30;
