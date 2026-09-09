import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseTranslationCachePurgeScope } from './translationCachePurge';

const valid = {
  weekOf: '2026-09-06',
  locations: ['GW'],
  languages: ['Japanese'],
};

describe('parseTranslationCachePurgeScope', () => {
  it('accepts English along with translated languages', () => {
    const scope = parseTranslationCachePurgeScope({
      ...valid,
      languages: ['English', 'Japanese', 'English'],
    });
    assert.deepEqual(scope?.languages, ['English', 'Japanese']);
  });

  it('accepts English by itself', () => {
    const scope = parseTranslationCachePurgeScope({
      ...valid,
      languages: ['English'],
    });
    assert.equal(scope?.weekOf, '2026-09-06');
    assert.deepEqual(scope?.languages, ['English']);
  });

  it('rejects unknown languages and empty selections', () => {
    assert.equal(parseTranslationCachePurgeScope({
      ...valid,
      languages: ['Spanish'],
    }), null);
    assert.equal(parseTranslationCachePurgeScope({
      ...valid,
      languages: [],
    }), null);
  });
});
