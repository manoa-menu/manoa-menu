import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  attachCcEnglishSources,
  attachSdxEnglishNames,
  englishSourceLabel,
} from './englishSource';
import type { DayMenu, FilteredSodexoMeal } from '../types/menuTypes';

describe('englishSourceLabel', () => {
  it('returns the English name when the translation differs', () => {
    assert.equal(englishSourceLabel('カルアポーク', 'Kalua Pork'), 'Kalua Pork');
    assert.equal(englishSourceLabel('乡村炸牛排', 'Country Fried Steak'), 'Country Fried Steak');
  });

  it('hides the English name when it already matches the translation', () => {
    assert.equal(englishSourceLabel('Kalua Pork', 'Kalua Pork'), undefined);
    assert.equal(englishSourceLabel('kalua pork', 'Kalua Pork'), undefined);
  });

  it('hides the English name when the translation is English plus a parenthetical', () => {
    assert.equal(
      englishSourceLabel('Kalua Pork（ハワイ風のほぐし豚肉）', 'Kalua Pork'),
      undefined,
    );
    assert.equal(
      englishSourceLabel('Loco Moco (rice with hamburger, gravy, and egg)', 'Loco Moco'),
      undefined,
    );
  });

  it('still shows English when a translated name has a clarifying note', () => {
    assert.equal(
      englishSourceLabel('ロコモコ（ご飯にハンバーグとグレービー）', 'Loco Moco'),
      'Loco Moco',
    );
  });
});

describe('attachCcEnglishSources', () => {
  const english: DayMenu[] = [{
    name: 'Monday',
    plateLunch: ['Kalua Pork', 'White Rice'],
    grabAndGo: ['Chicken Wrap'],
    specialMessage: 'Closed Friday',
  }];

  it('adds English dish arrays when section lengths match', () => {
    const translated: DayMenu[] = [{
      name: '月曜日',
      plateLunch: ['カルアポーク', '白米'],
      grabAndGo: ['チキンラップ'],
      specialMessage: '金曜日休業',
    }];

    const result = attachCcEnglishSources(translated, english);
    assert.deepEqual(result[0].plateLunchEnglish, ['Kalua Pork', 'White Rice']);
    assert.deepEqual(result[0].grabAndGoEnglish, ['Chicken Wrap']);
    assert.deepEqual(result[0].plateLunch, ['カルアポーク', '白米']);
  });

  it('skips a section when item counts differ', () => {
    const translated: DayMenu[] = [{
      name: '月曜日',
      plateLunch: ['カルアポーク'],
      grabAndGo: ['チキンラップ'],
      specialMessage: '金曜日休業',
    }];

    const result = attachCcEnglishSources(translated, english);
    assert.equal(result[0].plateLunchEnglish, undefined);
    assert.deepEqual(result[0].grabAndGoEnglish, ['Chicken Wrap']);
  });
});

describe('attachSdxEnglishNames', () => {
  const english: FilteredSodexoMeal[] = [{
    name: 'Lunch',
    groups: [{
      name: 'Entrees',
      items: [{
        course: null,
        meal: 'LUNCH',
        formalName: 'Garlic Chicken',
        description: 'Chicken breast seasoned with garlic',
        isVegan: false,
        isVegetarian: false,
      }],
    }],
  }];

  it('adds englishName when the menu trees match', () => {
    const translated: FilteredSodexoMeal[] = [{
      name: '昼食',
      groups: [{
        name: '主菜',
        items: [{
          ...english[0].groups[0].items[0],
          formalName: 'ガーリックチキン',
          description: 'にんにくチキン',
        }],
      }],
    }];

    const result = attachSdxEnglishNames(translated, english);
    assert.equal(result[0].groups[0].items[0].englishName, 'Garlic Chicken');
    assert.equal(result[0].groups[0].items[0].formalName, 'ガーリックチキン');
  });

  it('leaves items unchanged when group item counts differ', () => {
    const translated: FilteredSodexoMeal[] = [{
      name: '昼食',
      groups: [{
        name: '主菜',
        items: [
          { ...english[0].groups[0].items[0], formalName: 'ガーリックチキン' },
          { ...english[0].groups[0].items[0], formalName: '白米' },
        ],
      }],
    }];

    const result = attachSdxEnglishNames(translated, english);
    assert.equal(result[0].groups[0].items[0].englishName, undefined);
  });
});
