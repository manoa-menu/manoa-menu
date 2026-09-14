import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JSDOM } from 'jsdom';
import { parseMenuDateRange, parsePdfFilenameRange, collectCandidatesFromDom,
  collectCandidatesFromEmbeddedJson, findCurrentWeekMenu, createMenuCandidate } from './ccMenuParsing';
import { parseSdxMenuIds, uniqueSdxMenuApiUrls, buildSdxMenuApiUrl } from './sdxMenuEndpoint';
import { fetchSdxWithFallbacks, parseSdxMeals } from './sdxMenuSource';
import { readUpstream, singleFlight } from './upstreamFetch';
import { validateSdxWeek } from './menuClient';

const today = { year: 2026, month: 6, day: 6 };
const dateLabel = (date: Date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()];

describe('menu date recovery', () => {
  for (const label of [
    'July 6–10, 2026', '6-10 July 2026', '6 Jul-10 Jul', 'Jul. 6th through Jul. 10th',
    '7/6/26-7/10/26', '2026-07-06–2026-07-10', 'Monday, July 6 thru Friday, July 10',
    'July\u00a06\n to\nJuly\u00a010', '06 July 2026 to 10 July 2026', 'Jul 6, 2026-Jul 10, 2026',
  ]) {
    it(`recognizes ${JSON.stringify(label)}`, () => {
      const range = parseMenuDateRange(label, today);
      assert.ok(range);
      assert.deepEqual(dateLabel(range.startDate), [2026, 7, 6]);
      assert.deepEqual(dateLabel(range.endDate), [2026, 7, 10]);
    });
  }
  for (const label of ['Feb 30-Mar 4', '2/30/2026-3/4/2026', '2026-13-01 to 2026-13-05',
    'April 31-May 4', 'July 10-6', 'Jul 1-Jul 31', '7/0-7/4']) {
    it(`rejects impossible or implausible dates: ${label}`, () => {
      assert.equal(parseMenuDateRange(label, today), null);
    });
  }
  it('honors an explicit old year instead of presenting an archived menu as current', () => {
    const candidate = createMenuCandidate('July 6-July 10, 2025', '/menu.pdf', today);
    assert.ok(candidate);
    assert.equal(findCurrentWeekMenu([candidate], today), null);
  });
  for (const label of ['Dec 29-Jan 2, 2026', '12/29-1/2/2026', '29 Dec 2025-2 Jan', '12/29/2025-1/2']) {
    it(`infers only the missing year: ${label}`, () => {
      const range = parseMenuDateRange(label, { year: 2026, month: 0, day: 1 });
      assert.ok(range);
      assert.deepEqual(dateLabel(range.startDate), [2025, 12, 29]);
      assert.deepEqual(dateLabel(range.endDate), [2026, 1, 2]);
    });
  }
  it('supports Sept and leap years', () => {
    assert.ok(parseMenuDateRange('Sept. 7-11, 2026', today));
    assert.ok(parseMenuDateRange('2/29/2028-3/3/2028', today));
    assert.equal(parseMenuDateRange('2/29/2026-3/3/2026', today), null);
  });
  it('supports ISO filenames and rejects overflowing filename dates', () => {
    assert.deepEqual(dateLabel(parsePdfFilenameRange('/menu_2026-07-06.PDF', today)!.startDate), [2026, 7, 6]);
    assert.equal(parsePdfFilenameRange('/26-0230-menu.pdf', today), null);
  });
  it('finds dates in accessible labels and uppercase PDF links', () => {
    const dom = new JSDOM('<a href="/MENU.PDF?v=1" aria-label="July 6-10, 2026">Download</a>');
    assert.equal(collectCandidatesFromDom(dom.window.document, today).length, 1);
    dom.window.close();
  });
  it('reads spaced and escaped embedded PDF metadata', () => {
    const raw = JSON.stringify({ name: 'July 6-10, 2026', uri: '/web/en-us/media/menu.PDF?v=2' });
    assert.equal(collectCandidatesFromEmbeddedJson(JSON.stringify(raw), today).length, 1);
  });
  it('reads labels after the PDF URI without borrowing an adjacent menu label', () => {
    const html = '{"name":"July 13-17, 2026"},{"uri":"/menu.pdf","name":"July 6-10, 2026"}';
    const candidates = collectCandidatesFromEmbeddedJson(html, today);
    assert.equal(findCurrentWeekMenu(candidates, today)?.href, 'https://media-prd.sodexomyway.net/menu.pdf');
  });
});

const payload = [{ name: 'Lunch', groups: [{ name: 'Grill', items: [
  { formalName: 'Tofu', isVegan: true, isVegetarian: true },
] }] }];
const meals = parseSdxMeals(payload);

describe('API discovery and validation', () => {
  it('finds numeric IDs separated by unrelated metadata', () => {
    assert.deepEqual(parseSdxMenuIds('{"menuId":45,"title":"Menu","locationId":123}'),
      { locationId: '123', menuId: '45' });
  });
  it('does not pair IDs from unrelated objects', () => {
    assert.equal(parseSdxMenuIds('{"locationId":123},{"menuId":45}'), null);
  });
  it('uses an embedded API path as a discovery fallback', () => {
    assert.deepEqual(parseSdxMenuIds('"url":"https://example.com/v0.2/data/menu/123/45"'),
      { locationId: '123', menuId: '45' });
  });
  it('preserves API version and query parameters during discovery', () => {
    assert.equal(buildSdxMenuApiUrl({ locationId: '3', menuId: '4' },
      'https://example.com/v0.3/data/menu/1/2?site=uhm'), 'https://example.com/v0.3/data/menu/3/4?site=uhm');
  });
  it('keeps backup hosts even when IDs match', () => {
    assert.equal(uniqueSdxMenuApiUrls('https://a.test/data/menu/1/2', 'https://b.test/data/menu/1/2').length, 2);
  });
  it('keeps distinct API versions even when IDs match', () => {
    assert.equal(uniqueSdxMenuApiUrls('https://a.test/v1/data/menu/1/2',
      'https://a.test/v2/data/menu/1/2').length, 2);
  });
  it('accepts meal/data envelopes and safely defaults optional item fields', () => {
    assert.deepEqual(parseSdxMeals({ meals: payload }), meals);
    assert.deepEqual(parseSdxMeals({ data: payload }), meals);
    assert.equal(meals[0].groups[0].items[0].description, '');
  });
  it('rejects error responses and damaged nested data instead of returning empty meals', () => {
    for (const value of [{ error: 'unauthorized' }, '<html>blocked</html>', null,
      [{ name: 'Lunch', groups: null }], [{ name: 'Lunch', groups: [{ items: [null] }] }]]) {
      assert.throws(() => parseSdxMeals(value));
    }
  });
  it('keeps valid empty menus and removes closed-day placeholders', () => {
    assert.deepEqual(parseSdxMeals([]), []);
    assert.deepEqual(parseSdxMeals([{ name: 'Lunch', groups: [{ name: 'Grill',
      items: [{ formalName: 'Have A Nice Day' }] }] }]), []);
  });
  it('validates client payloads before rendering and retains partial-day status', () => {
    assert.throws(() => validateSdxWeek({ error: 'failure' }));
    assert.throws(() => validateSdxWeek([{ date: '2026-07-06', meals: null }]));
    assert.throws(() => validateSdxWeek([{ date: '2026-02-30', meals: [] }]));
    assert.equal(validateSdxWeek([{ date: '2026-07-06', meals: [], status: 'unavailable' }])[0].status,
      'unavailable');
  });
});

describe('backup recovery', () => {
  it('tries backups after HTTP errors, then discovers live IDs after an empty backup', async () => {
    const visited: string[] = [];
    const result = await fetchSdxWithFallbacks(['primary', 'backup'], async () => ['primary', 'live'], async url => {
      visited.push(url);
      if (url === 'primary') throw new Error('HTTP 503');
      return url === 'live' ? meals : [];
    });
    assert.deepEqual(visited, ['primary', 'backup', 'live']);
    assert.deepEqual(result, meals);
  });
  it('avoids discovery when a configured source works', async () => {
    assert.deepEqual(await fetchSdxWithFallbacks(['primary'], async () => { throw new Error('not needed'); },
      async () => meals), meals);
  });
  it('distinguishes an outage from a confirmed empty menu', async () => {
    await assert.rejects(fetchSdxWithFallbacks(['primary'], async () => [], async () => {
      throw new Error('offline');
    }), /All menu sources failed/);
    assert.deepEqual(await fetchSdxWithFallbacks(['primary'], async () => [], async () => []), []);
  });
});

describe('bounded upstream requests', () => {
  it('retries transient failures and honors bounded Retry-After', async () => {
    let calls = 0;
    const sleeps: number[] = [];
    const result = await readUpstream('https://example.com', r => r.text(), {}, {
      fetchImpl: async () => ++calls === 1
        ? new Response('busy', { status: 503, headers: { 'Retry-After': '60' } }) : new Response('menu'),
      sleep: async ms => { sleeps.push(ms); },
    });
    assert.equal(result, 'menu');
    assert.equal(calls, 2);
    assert.deepEqual(sleeps, [2000]);
  });
  it('does not retry permanent authorization failures', async () => {
    let calls = 0;
    await assert.rejects(readUpstream('https://example.com', r => r.text(), {}, {
      fetchImpl: async () => { calls++; return new Response('', { status: 401 }); },
    }), /401/);
    assert.equal(calls, 1);
  });
  it('times out a stalled body read, not just the response headers', async () => {
    await assert.rejects(readUpstream('https://example.com', r => r.text(), {}, {
      timeoutMs: 10, attempts: 1,
      fetchImpl: async (_url, init) => new Response(new ReadableStream({
        start(controller) {
          init?.signal?.addEventListener('abort', () => controller.error(new Error('body aborted')));
        },
      })),
    }), /body aborted/);
  });
  it('shares concurrent work and clears failed work before another request', async () => {
    const share = singleFlight<string>();
    let calls = 0;
    const work = async () => { calls++; throw new Error('offline'); };
    await Promise.allSettled([share('week', work), share('week', work)]);
    assert.equal(calls, 1);
    assert.equal(await share('week', async () => 'recovered'), 'recovered');
  });
});
