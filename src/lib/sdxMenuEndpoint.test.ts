import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildSdxMenuApiUrl,
  parseSdxMenuIds,
  parseSdxMenuIdsFromApiUrl,
  resolveSdxMenuApiUrl,
  sdxMenuApiUrlsMatch,
  uniqueSdxMenuApiUrls,
} from './sdxMenuEndpoint';

const gatewayHtml = `
<script>window.__PRELOADED_STATE__ = {"fragments":[{"content":{"main":{
  "metadata":{"locationId":"10230002","menuId":"1410922"}
}}}]};</script>
`;

const reversedHtml = '{"metadata":{"menuId":"1411020","locationId":"10230007"}}';

describe('parseSdxMenuIds', () => {
  it('reads locationId and menuId from Gateway page metadata', () => {
    assert.deepEqual(parseSdxMenuIds(gatewayHtml), {
      locationId: '10230002',
      menuId: '1410922',
    });
  });

  it('accepts menuId before locationId', () => {
    assert.deepEqual(parseSdxMenuIds(reversedHtml), {
      locationId: '10230007',
      menuId: '1411020',
    });
  });

  it('returns null when metadata is missing', () => {
    assert.equal(parseSdxMenuIds('<html>no menu ids</html>'), null);
  });
});

describe('buildSdxMenuApiUrl', () => {
  it('rebuilds the API path from page IDs while keeping the env host', () => {
    const stale = 'https://api-prd.sodexomyway.net/v0.2/data/menu/10230001/29647';
    assert.equal(
      buildSdxMenuApiUrl({ locationId: '10230002', menuId: '1410922' }, stale),
      'https://api-prd.sodexomyway.net/v0.2/data/menu/10230002/1410922',
    );
  });
});

describe('sdxMenuApiUrlsMatch', () => {
  it('treats the stale Gateway IDs as different from the live page IDs', () => {
    const stale = 'https://api-prd.sodexomyway.net/v0.2/data/menu/10230001/29647';
    const live = 'https://api-prd.sodexomyway.net/v0.2/data/menu/10230002/1410922';
    assert.equal(sdxMenuApiUrlsMatch(stale, live), false);
    assert.equal(sdxMenuApiUrlsMatch(live, `${live}/`), true);
  });
});

describe('uniqueSdxMenuApiUrls', () => {
  it('keeps the new Gateway URL first and the old one as backup', () => {
    const primary = 'https://api-prd.sodexomyway.net/v0.2/data/menu/10230002/1410922';
    const backup = 'https://api-prd.sodexomyway.net/v0.2/data/menu/10230001/29647';
    assert.deepEqual(uniqueSdxMenuApiUrls(primary, backup, `${primary}/`), [primary, backup]);
  });

  it('skips blank extras', () => {
    const primary = 'https://api-prd.sodexomyway.net/v0.2/data/menu/10230002/1410922';
    assert.deepEqual(uniqueSdxMenuApiUrls(primary, undefined, '  ', null), [primary]);
  });
});

describe('parseSdxMenuIdsFromApiUrl', () => {
  it('reads IDs from the menu API path', () => {
    assert.deepEqual(
      parseSdxMenuIdsFromApiUrl('https://api-prd.sodexomyway.net/v0.2/data/menu/10230001/29647?date=2026-09-08'),
      { locationId: '10230001', menuId: '29647' },
    );
  });
});

describe('resolveSdxMenuApiUrl', () => {
  it('replaces stale env IDs with IDs from the location page', async () => {
    const stale = 'https://api-prd.sodexomyway.net/v0.2/data/menu/10230001/29647';
    const resolved = await resolveSdxMenuApiUrl(
      'https://uhm.sodexomyway.com/en-us/locations/gateway-cafe',
      stale,
      async () => gatewayHtml,
    );
    assert.equal(resolved, 'https://api-prd.sodexomyway.net/v0.2/data/menu/10230002/1410922');
  });

  it('keeps the env URL when the location page has no IDs', async () => {
    const fallback = 'https://api-prd.sodexomyway.net/v0.2/data/menu/10230001/29647';
    const resolved = await resolveSdxMenuApiUrl(
      'https://uhm.sodexomyway.com/en-us/locations/gateway-cafe',
      fallback,
      async () => '<html></html>',
    );
    assert.equal(resolved, fallback);
  });
});
