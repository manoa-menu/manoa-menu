import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  lookupTranslation,
  setUniqueTranslation,
  uniqueTranslationEntries,
} from './translationSource';

describe('translation source uniqueness', () => {
  it('looks up translations ignoring case and extra spaces', () => {
    const translations = new Map([['BBQ Beef Brisket', 'BBQビーフ']]);
    assert.equal(lookupTranslation(translations, 'Bbq Beef Brisket'), 'BBQビーフ');
    assert.equal(lookupTranslation(translations, 'BBQ  Beef Brisket'), 'BBQビーフ');
  });

  it('keeps the first casing when inserting duplicates', () => {
    const translations = new Map<string, string>();
    setUniqueTranslation(translations, 'BBQ Beef Brisket', 'A');
    setUniqueTranslation(translations, 'Bbq Beef Brisket', 'B');
    assert.deepEqual([...translations.entries()], [['BBQ Beef Brisket', 'A']]);
  });

  it('overwrites a case variant when requested', () => {
    const translations = new Map<string, string>();
    setUniqueTranslation(translations, 'Bbq Beef Brisket', 'A');
    setUniqueTranslation(translations, 'BBQ Beef Brisket', 'B', true);
    assert.equal(lookupTranslation(translations, 'bbq beef brisket'), 'B');
    assert.equal(translations.size, 1);
  });

  it('collapses entries before save', () => {
    assert.deepEqual(
      uniqueTranslationEntries([
        ['BBQ Beef Brisket', 'A'],
        ['Bbq Beef Brisket', 'B'],
        ['  White Rice ', '白米'],
      ]),
      [
        ['BBQ Beef Brisket', 'A'],
        ['White Rice', '白米'],
      ],
    );
  });
});
