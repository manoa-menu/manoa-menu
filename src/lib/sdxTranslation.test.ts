import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applySdxTranslations,
  buildSdxTranslationMap,
  collectSdxTranslatableStrings,
} from './sdxTranslation';
import type { FilteredSodexoMeal } from '../types/menuTypes';

const sampleItem = {
  course: null,
  meal: 'LUNCH',
  formalName: 'Garlic Chicken',
  description: 'Chicken breast seasoned with garlic',
  isVegan: false,
  isVegetarian: false,
};

const makeMenu = (formalName: string): FilteredSodexoMeal[] => [{
  name: 'Lunch',
  groups: [{
    name: 'Entrees',
    items: [{ ...sampleItem, formalName, description: formalName }],
  }],
}];

describe('collectSdxTranslatableStrings', () => {
  it('dedupes repeated strings across days while preserving first-seen order', () => {
    const strings = collectSdxTranslatableStrings([
      makeMenu('White Rice'),
      makeMenu('White Rice'),
      makeMenu('Grilled Salmon'),
    ]);

    assert.deepEqual(strings, ['Lunch', 'Entrees', 'White Rice', 'Grilled Salmon']);
  });
});

describe('applySdxTranslations', () => {
  it('translates menu text fields and preserves non-text fields', () => {
    const englishMenu = makeMenu('Garlic Chicken');
    const translations = buildSdxTranslationMap(
      ['Lunch', 'Entrees', 'Garlic Chicken'],
      ['昼食', '主菜', 'ガーリックチキン'],
    );

    const translated = applySdxTranslations(englishMenu, translations);

    assert.equal(translated[0].name, '昼食');
    assert.equal(translated[0].groups[0].name, '主菜');
    assert.equal(translated[0].groups[0].items[0].formalName, 'ガーリックチキン');
    assert.equal(translated[0].groups[0].items[0].meal, 'LUNCH');
    assert.equal(translated[0].groups[0].items[0].isVegan, false);
  });

  it('keeps English when a translation is blank', () => {
    const englishMenu = makeMenu('Crispy Sesame Tofu Bowl');
    const translations = buildSdxTranslationMap(
      ['Lunch', 'Entrees', 'Crispy Sesame Tofu Bowl'],
      ['昼食', '', 'クリスピーセサミ豆腐ボウル'],
    );

    const translated = applySdxTranslations(englishMenu, translations);

    assert.equal(translated[0].name, '昼食');
    assert.equal(translated[0].groups[0].name, 'Entrees');
    assert.equal(translated[0].groups[0].items[0].formalName, 'クリスピーセサミ豆腐ボウル');
  });
});
