import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JSDOM } from 'jsdom';

import {
  collectCandidatesFromDom,
  collectCandidatesFromEmbeddedJson,
  createMenuCandidate,
  findCurrentWeekMenu,
  isTodayWithinRange,
  mergeMenuCandidates,
  rangeOverlapsCurrentWeek,
  normalizePdfHref,
  parseMenuDateRange,
  parsePdfFilenameRange,
} from './ccMenuParsing';
import type { DateParts, MenuCandidate } from './ccMenuParsing';

const julySix2026: DateParts = { year: 2026, month: 6, day: 6 };
const julyEleven2026: DateParts = { year: 2026, month: 6, day: 11 };
const augTwentyThree2026: DateParts = { year: 2026, month: 7, day: 23 };
const augTwentyFive2026: DateParts = { year: 2026, month: 7, day: 25 };

function assertDate(date: Date, year: number, month: number, day: number): void {
  assert.equal(date.getFullYear(), year);
  assert.equal(date.getMonth(), month);
  assert.equal(date.getDate(), day);
}

function makeCandidate(
  label: string,
  href: string,
  startYear: number,
  startMonth: number,
  startDay: number,
  endYear: number,
  endMonth: number,
  endDay: number,
): MenuCandidate {
  return {
    label,
    href,
    startDate: new Date(startYear, startMonth, startDay),
    endDate: new Date(endYear, endMonth, endDay),
  };
}

describe('parseMenuDateRange', () => {
  it('parses a date range with no venue wording', () => {
    const parsed = parseMenuDateRange('24 Aug to 28 Aug', augTwentyFive2026);

    assert.ok(parsed);
    assert.equal(parsed.format, 'day-month');
    assertDate(parsed.startDate, 2026, 7, 24);
    assertDate(parsed.endDate, 2026, 7, 28);
  });

  it('parses weekday-prefixed day-month ranges', () => {
    const parsed = parseMenuDateRange('Mon 6 Jul - Fri 10 Jul', julySix2026);

    assert.ok(parsed);
    assert.equal(parsed.format, 'day-month');
    assertDate(parsed.startDate, 2026, 6, 6);
    assertDate(parsed.endDate, 2026, 6, 10);
  });

  it('parses labels that omit the word Menu', () => {
    const parsed = parseMenuDateRange(
      'Campus Center Food Court 24 Aug to 28 Aug',
      augTwentyFive2026,
    );

    assert.ok(parsed);
    assert.equal(parsed.format, 'day-month');
    assertDate(parsed.startDate, 2026, 7, 24);
    assertDate(parsed.endDate, 2026, 7, 28);
  });

  it('parses the primary day-month format', () => {
    const parsed = parseMenuDateRange(
      'Campus Center Food Court Menu 06 July to 10 July',
      julySix2026,
    );

    assert.ok(parsed);
    assert.equal(parsed.format, 'day-month');
    assertDate(parsed.startDate, 2026, 6, 6);
    assertDate(parsed.endDate, 2026, 6, 10);
  });

  it('parses abbreviated months and hyphen separators', () => {
    const parsed = parseMenuDateRange(
      'Campus Center Food Court Menu 03 Mar to 09 Mar',
      { year: 2026, month: 2, day: 5 },
    );

    assert.ok(parsed);
    assert.equal(parsed.format, 'day-month');
    assertDate(parsed.startDate, 2026, 2, 3);
    assertDate(parsed.endDate, 2026, 2, 9);
  });

  it('parses en-dash, em-dash, and ordinal suffixes', () => {
    const dashParsed = parseMenuDateRange(
      'Campus Center Food Court Menu 29 June – 03 July',
      julySix2026,
    );
    const ordinalParsed = parseMenuDateRange(
      'Campus Center Food Court Menu 6th July to 10th July',
      julySix2026,
    );

    assert.ok(dashParsed);
    assertDate(dashParsed.startDate, 2026, 5, 29);
    assertDate(dashParsed.endDate, 2026, 6, 3);

    assert.ok(ordinalParsed);
    assert.equal(ordinalParsed.format, 'day-month');
    assertDate(ordinalParsed.startDate, 2026, 6, 6);
    assertDate(ordinalParsed.endDate, 2026, 6, 10);
  });

  it('parses month-day format as a secondary parser', () => {
    const parsed = parseMenuDateRange(
      'Campus Center Food Court Menu July 6 to July 10',
      julySix2026,
    );

    assert.ok(parsed);
    assert.equal(parsed.format, 'month-day');
    assertDate(parsed.startDate, 2026, 6, 6);
    assertDate(parsed.endDate, 2026, 6, 10);
  });

  it('parses numeric month/day format as a secondary parser', () => {
    const parsed = parseMenuDateRange(
      'Campus Center Food Court Menu 7/6 to 7/10',
      julySix2026,
    );

    assert.ok(parsed);
    assert.equal(parsed.format, 'numeric');
    assertDate(parsed.startDate, 2026, 6, 6);
    assertDate(parsed.endDate, 2026, 6, 10);
  });

  it('parses numeric ranges with explicit years', () => {
    const parsed = parseMenuDateRange(
      'Campus Center Food Court Menu 07/06/2026 to 07/10/2026',
      julySix2026,
    );

    assert.ok(parsed);
    assert.equal(parsed.format, 'numeric');
    assertDate(parsed.startDate, 2026, 6, 6);
    assertDate(parsed.endDate, 2026, 6, 10);
  });

  it('parses ISO date ranges as a secondary parser', () => {
    const parsed = parseMenuDateRange(
      'Campus Center Food Court Menu 2026-07-06 to 2026-07-10',
      julySix2026,
    );

    assert.ok(parsed);
    assert.equal(parsed.format, 'iso');
    assertDate(parsed.startDate, 2026, 6, 6);
    assertDate(parsed.endDate, 2026, 6, 10);
  });

  it('handles year-boundary ranges that cross December and January', () => {
    const parsed = parseMenuDateRange(
      'Campus Center Food Court Menu 29 Dec to 02 Jan',
      { year: 2026, month: 0, day: 1 },
    );

    assert.ok(parsed);
    assertDate(parsed.startDate, 2025, 11, 29);
    assertDate(parsed.endDate, 2026, 0, 2);
  });

  it('returns null for unsupported labels', () => {
    assert.equal(parseMenuDateRange('Campus Center Food Court Menu', julySix2026), null);
    assert.equal(parseMenuDateRange('No dates here at all', julySix2026), null);
    assert.equal(parseMenuDateRange('1 January to 31 January', julySix2026), null);
  });
});

describe('parsePdfFilenameRange', () => {
  it('reads YY-MMDD from the PDF filename as a Mon-Fri week', () => {
    const parsed = parsePdfFilenameRange(
      '/web/en-us/media/26-0824%20printed%20menu%20b_tcm17-93718.pdf',
      augTwentyFive2026,
    );

    assert.ok(parsed);
    assert.equal(parsed.format, 'filename');
    assertDate(parsed.startDate, 2026, 7, 24);
    assertDate(parsed.endDate, 2026, 7, 28);
  });

  it('ignores tcm id numbers in the filename', () => {
    assert.equal(
      parsePdfFilenameRange('/web/en-us/media/menu_tcm17-89982.pdf', julySix2026),
      null,
    );
  });
});

describe('normalizePdfHref', () => {
  it('prefixes relative Sodexo media paths', () => {
    assert.equal(
      normalizePdfHref('/web/en-us/media/menu_tcm17-89982.pdf'),
      'https://media-prd.sodexomyway.net/web/en-us/media/menu_tcm17-89982.pdf',
    );
  });

  it('leaves absolute URLs unchanged', () => {
    const absolute = 'https://media-prd.sodexomyway.net/web/en-us/media/menu.pdf';
    assert.equal(normalizePdfHref(absolute), absolute);
  });
});

describe('findCurrentWeekMenu', () => {
  const candidates = [
    makeCandidate(
      'Campus Center Food Court Menu 29 June to 03 July',
      'https://example.com/june.pdf',
      2026, 5, 29, 2026, 6, 3,
    ),
    makeCandidate(
      'Campus Center Food Court Menu 06 July to 10 July',
      'https://example.com/july.pdf',
      2026, 6, 6, 2026, 6, 10,
    ),
    makeCandidate(
      'Campus Center Food Court Menu 13 July to 17 July',
      'https://example.com/next.pdf',
      2026, 6, 13, 2026, 6, 17,
    ),
  ];

  it('matches only the menu that contains today', () => {
    const match = findCurrentWeekMenu(candidates, julySix2026);

    assert.ok(match);
    assert.equal(match.href, 'https://example.com/july.pdf');
    assert.equal(match.label, 'Campus Center Food Court Menu 06 July to 10 July');
  });

  it('matches a Mon-Fri menu on Sunday and Saturday of the same week', () => {
    const sundayBefore = { year: 2026, month: 6, day: 5 };
    const saturdayAfter = julyEleven2026;

    const sundayMatch = findCurrentWeekMenu(candidates, sundayBefore);
    const saturdayMatch = findCurrentWeekMenu(candidates, saturdayAfter);

    assert.ok(sundayMatch);
    assert.equal(sundayMatch.href, 'https://example.com/july.pdf');
    assert.ok(saturdayMatch);
    assert.equal(saturdayMatch.href, 'https://example.com/july.pdf');
  });

  it('does not fall back to the first or nearest menu', () => {
    const onlyPastAndFuture = [candidates[0], candidates[2]];
    assert.equal(findCurrentWeekMenu(onlyPastAndFuture, julySix2026), null);
  });
});

describe('rangeOverlapsCurrentWeek', () => {
  it('treats a Mon-Fri range as part of the Sunday-Saturday week', () => {
    const start = new Date(2026, 7, 24);
    const end = new Date(2026, 7, 28);

    assert.equal(rangeOverlapsCurrentWeek(augTwentyThree2026, start, end), true);
    assert.equal(rangeOverlapsCurrentWeek(augTwentyFive2026, start, end), true);
    assert.equal(rangeOverlapsCurrentWeek({ year: 2026, month: 7, day: 29 }, start, end), true);
    assert.equal(rangeOverlapsCurrentWeek({ year: 2026, month: 7, day: 22 }, start, end), false);
    assert.equal(rangeOverlapsCurrentWeek({ year: 2026, month: 7, day: 30 }, start, end), false);
  });
});

describe('isTodayWithinRange', () => {
  it('treats range endpoints as inclusive', () => {
    const start = new Date(2026, 6, 6);
    const end = new Date(2026, 6, 10);

    assert.equal(isTodayWithinRange(julySix2026, start, end), true);
    assert.equal(isTodayWithinRange({ year: 2026, month: 6, day: 10 }, start, end), true);
    assert.equal(isTodayWithinRange(julyEleven2026, start, end), false);
  });
});

describe('collectCandidatesFromEmbeddedJson', () => {
  it('extracts a nearby name even when venue wording changes', () => {
    const html = `
      "name":"Weekly Menu 24 Aug to 28 Aug",
      "link":{"media":{"content":{"main":{"uri":"/web/en-us/media/26-0824%20printed%20menu%20b_tcm17-93718.pdf"}}}}
    `;

    const candidates = collectCandidatesFromEmbeddedJson(html, augTwentyFive2026);

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].label, 'Weekly Menu 24 Aug to 28 Aug');
  });

  it('uses the PDF filename dates when the nearby name has no range', () => {
    const html = `
      "name":"Download",
      "link":{"media":{"content":{"main":{"uri":"/web/en-us/media/26-0824%20printed%20menu%20b_tcm17-93718.pdf"}}}}
    `;

    const candidates = collectCandidatesFromEmbeddedJson(html, augTwentyFive2026);

    assert.equal(candidates.length, 1);
    assertDate(candidates[0].startDate, 2026, 7, 24);
    assertDate(candidates[0].endDate, 2026, 7, 28);
  });

  it('extracts menu labels and PDF URIs from embedded page JSON', () => {
    const html = `
      "name":"Campus Center Food Court Menu 06 July to 10 July",
      "link":{"media":{"content":{"main":{"uri":"/web/en-us/media/26-0706%20menu_tcm17-89982.pdf"}}}}
      "name":"Campus Center Food Court Menu 13 July to 17 July",
      "link":{"media":{"content":{"main":{"uri":"/web/en-us/media/26-0713%20menu_tcm17-90068.pdf"}}}}
    `;

    const candidates = collectCandidatesFromEmbeddedJson(html, julySix2026);

    assert.equal(candidates.length, 2);
    assert.equal(candidates[0].label, 'Campus Center Food Court Menu 06 July to 10 July');
    assert.equal(
      candidates[0].href,
      'https://media-prd.sodexomyway.net/web/en-us/media/26-0706%20menu_tcm17-89982.pdf',
    );
  });
});

describe('collectCandidatesFromDom', () => {
  it('accepts a PDF link whose visible text is only a date range', () => {
    const html = `
      <a href="https://media-prd.sodexomyway.net/web/en-us/media/week.pdf">
        24 Aug to 28 Aug
      </a>
    `;

    const doc = new JSDOM(html).window.document;
    const candidates = collectCandidatesFromDom(doc, augTwentyFive2026);

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].label, '24 Aug to 28 Aug');
  });

  it('reads MenuApp links whose labels omit the word Menu', () => {
    const html = `
      <div class="MenuAppstyles__MenuLinkContainer-sc-hftaq1-1 gRMdaN">
        <a href="https://media-prd.sodexomyway.net/web/en-us/media/26-0824%20printed%20menu%20b_tcm17-93718.pdf">
          Campus Center Food Court 24 Aug to 28 Aug
        </a>
      </div>
    `;

    const doc = new JSDOM(html).window.document;
    const candidates = collectCandidatesFromDom(doc, augTwentyFive2026);

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].label, 'Campus Center Food Court 24 Aug to 28 Aug');
  });

  it('reads menu links from MenuLinkContainer anchors', () => {
    const html = `
      <div class="Locationstyles__MenuLinkContainer-sc-nt7jmt-17">
        <a href="https://media-prd.sodexomyway.net/web/en-us/media/week-one.pdf">
          Campus Center Food Court Menu 06 July to 10 July
        </a>
      </div>
      <div class="Locationstyles__MenuLinkContainer-sc-nt7jmt-17">
        <a href="https://media-prd.sodexomyway.net/web/en-us/media/week-two.pdf">
          Campus Center Food Court Menu 13 July to 17 July
        </a>
      </div>
    `;

    const doc = new JSDOM(html).window.document;
    const candidates = collectCandidatesFromDom(doc, julySix2026);

    assert.equal(candidates.length, 2);
    assert.equal(candidates[0].label, 'Campus Center Food Court Menu 06 July to 10 July');
    assert.equal(candidates[1].label, 'Campus Center Food Court Menu 13 July to 17 July');
  });
});

describe('mergeMenuCandidates', () => {
  it('deduplicates candidates by normalized PDF href', () => {
    const domCandidates = [
      createMenuCandidate(
        'Campus Center Food Court Menu 06 July to 10 July',
        'https://media-prd.sodexomyway.net/web/en-us/media/menu.pdf',
        julySix2026,
      ),
    ].filter((candidate): candidate is MenuCandidate => candidate !== null);

    const jsonCandidates = [
      createMenuCandidate(
        'Campus Center Food Court Menu 06 July to 10 July',
        '/web/en-us/media/menu.pdf',
        julySix2026,
      ),
    ].filter((candidate): candidate is MenuCandidate => candidate !== null);

    const merged = mergeMenuCandidates(domCandidates, jsonCandidates);

    assert.equal(merged.length, 1);
    assert.equal(
      merged[0].href,
      'https://media-prd.sodexomyway.net/web/en-us/media/menu.pdf',
    );
  });
});

describe('createMenuCandidate', () => {
  it('accepts a date range with no Campus Center wording', () => {
    const candidate = createMenuCandidate(
      '24 Aug to 28 Aug',
      '/web/en-us/media/menu.pdf',
      augTwentyFive2026,
    );

    assert.ok(candidate);
    assertDate(candidate.startDate, 2026, 7, 24);
    assertDate(candidate.endDate, 2026, 7, 28);
  });

  it('falls back to filename dates when the label has no numbers', () => {
    const candidate = createMenuCandidate(
      'Download PDF',
      '/web/en-us/media/26-0824%20printed%20menu%20b_tcm17-93718.pdf',
      augTwentyThree2026,
    );

    assert.ok(candidate);
    assertDate(candidate.startDate, 2026, 7, 24);
    assertDate(candidate.endDate, 2026, 7, 28);
    assert.equal(
      findCurrentWeekMenu([candidate], augTwentyThree2026)?.href,
      candidate.href,
    );
  });

  it('accepts the live Sodexo label without the word Menu', () => {
    const candidate = createMenuCandidate(
      'Campus Center Food Court 24 Aug to 28 Aug',
      '/web/en-us/media/26-0824%20printed%20menu%20b_tcm17-93718.pdf',
      augTwentyThree2026,
    );

    assert.ok(candidate);
    assertDate(candidate.startDate, 2026, 7, 24);
    assertDate(candidate.endDate, 2026, 7, 28);
    assert.equal(
      findCurrentWeekMenu([candidate], augTwentyThree2026)?.href,
      candidate.href,
    );
  });

  it('builds a normalized candidate from a label and href', () => {
    const candidate = createMenuCandidate(
      'Campus Center Food Court Menu July 6 to July 10',
      '/web/en-us/media/menu.pdf',
      julySix2026,
    );

    assert.ok(candidate);
    assert.equal(candidate.href, 'https://media-prd.sodexomyway.net/web/en-us/media/menu.pdf');
    assertDate(candidate.startDate, 2026, 6, 6);
    assertDate(candidate.endDate, 2026, 6, 10);
  });

  it('returns null when the label and filename have no parseable date range', () => {
    assert.equal(
      createMenuCandidate('Campus Center Food Court Menu', '/web/en-us/media/menu.pdf', julySix2026),
      null,
    );
    assert.equal(
      createMenuCandidate('Hours of operation', '/web/en-us/media/menu_tcm17-89982.pdf', julySix2026),
      null,
    );
  });
});
