import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyCcTranslations,
  collectCcTranslatableStrings,
  extractCcTranslationPairs,
} from './ccTranslation';
import type { DayMenu } from '../types/menuTypes';

const english: DayMenu[] = [{
  name: 'Monday',
  plateLunch: ['Kalua Pork', 'White Rice'],
  grabAndGo: ['Chicken Wrap'],
  specialMessage: 'Closed Friday',
}];

const translated: DayMenu[] = [{
  name: '月曜日',
  plateLunch: ['カルアポーク', '白米'],
  grabAndGo: ['チキンラップ'],
  specialMessage: '金曜日休業',
}];

describe('collectCcTranslatableStrings', () => {
  it('collects plate, grab-and-go, and special message strings', () => {
    assert.deepEqual(
      collectCcTranslatableStrings(english),
      ['Kalua Pork', 'White Rice', 'Chicken Wrap', 'Closed Friday'],
    );
  });

  it('does not collect duplicate dishes across sections or case variants', () => {
    const menu: DayMenu[] = [{
      name: 'Monday',
      plateLunch: ['Kalua Pork', 'White Rice'],
      grabAndGo: ['kalua pork', 'Chicken Wrap'],
      specialMessage: 'White Rice',
    }];
    assert.deepEqual(
      collectCcTranslatableStrings(menu),
      ['Kalua Pork', 'White Rice', 'Chicken Wrap'],
    );
  });
});

describe('extractCcTranslationPairs', () => {
  it('pairs matching Campus Center menus', () => {
    assert.deepEqual(extractCcTranslationPairs(english, translated), [
      ['Kalua Pork', 'カルアポーク'],
      ['White Rice', '白米'],
      ['Chicken Wrap', 'チキンラップ'],
      ['Closed Friday', '金曜日休業'],
    ]);
  });

  it('returns no pairs when item counts differ', () => {
    const mismatched: DayMenu[] = [{
      ...translated[0],
      plateLunch: ['カルアポーク'],
    }];
    assert.deepEqual(extractCcTranslationPairs(english, mismatched), []);
  });
});

describe('applyCcTranslations', () => {
  it('translates dish strings and leaves the day name alone', () => {
    const result = applyCcTranslations(
      english,
      new Map([
        ['Kalua Pork', 'カルアポーク'],
        ['White Rice', '白米'],
        ['Chicken Wrap', 'チキンラップ'],
        ['Closed Friday', '金曜日休業'],
      ]),
    );

    assert.equal(result[0].name, 'Monday');
    assert.deepEqual(result[0].plateLunch, ['カルアポーク', '白米']);
    assert.equal(result[0].grabAndGo[0], 'チキンラップ');
    assert.equal(result[0].specialMessage, '金曜日休業');
  });
});
