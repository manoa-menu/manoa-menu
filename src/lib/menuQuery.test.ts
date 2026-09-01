import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseMenuLanguage, parseSdxLocation } from './menuQuery';

describe('parseMenuLanguage', () => {
  it('accepts title case and mixed case', () => {
    assert.equal(parseMenuLanguage('English'), 'English');
    assert.equal(parseMenuLanguage('japanese'), 'Japanese');
    assert.equal(parseMenuLanguage('KOREAN'), 'Korean');
    assert.equal(parseMenuLanguage(' Chinese '), 'Chinese');
  });

  it('rejects missing, blank, and unknown languages', () => {
    assert.equal(parseMenuLanguage(null), null);
    assert.equal(parseMenuLanguage(undefined), null);
    assert.equal(parseMenuLanguage(''), null);
    assert.equal(parseMenuLanguage('Spanish'), null);
    assert.equal(parseMenuLanguage('Klingon'), null);
  });
});

describe('parseSdxLocation', () => {
  it('accepts gw and ha', () => {
    assert.equal(parseSdxLocation('gw'), 'gw');
    assert.equal(parseSdxLocation('HA'), 'ha');
  });

  it('rejects missing and unknown locations', () => {
    assert.equal(parseSdxLocation(null), null);
    assert.equal(parseSdxLocation(''), null);
    assert.equal(parseSdxLocation('cc'), null);
    assert.equal(parseSdxLocation('gateway'), null);
  });
});
