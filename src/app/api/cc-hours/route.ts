import { NextResponse } from 'next/server';
// import { scrapeCCHours } from '@/lib/scrapeCCUrl';

// const CC_URL = 'https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court';

function getCCHoursStatusHST(now: Date = new Date()): 'Open' | 'Closed' {
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Honolulu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const hstDate = dateFormatter.format(now);
  // Temporary closure window in HST (inclusive)
  if (hstDate >= '2026-03-14' && hstDate <= '2026-03-22') {
    return 'Closed';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Honolulu',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '-1');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '-1');

  const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday ?? '');
  const minutesSinceMidnight = (hour * 60) + minute;
  const openStart = 7 * 60; // 07:00 HST
  const openEnd = 14 * 60; // 14:00 HST
  const isWithinHours = minutesSinceMidnight >= openStart && minutesSinceMidnight < openEnd;

  return isWeekday && isWithinHours ? 'Open' : 'Closed';
}

export async function GET() {
  try {
    // Temporary override: do not scrape live CC hours API.
    // const hours = await scrapeCCHours(CC_URL);
    // return NextResponse.json({ hours: hours ?? null });

    const hstNow = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Pacific/Honolulu',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    }).format(new Date());

    const hours = getCCHoursStatusHST();
    console.log(`[cc-hours] Current HST time: ${hstNow} | Status: ${hours}`);
    return NextResponse.json({ hours });
  } catch (error) {
    console.error('Error scraping CC hours:', error);
    return NextResponse.json({ hours: null });
  }
}

export const maxDuration = 30;
