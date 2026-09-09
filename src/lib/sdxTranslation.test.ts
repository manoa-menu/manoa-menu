import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applySdxTranslations,
  buildSdxTranslationMap,
  collectSdxTranslatableStrings,
  extractSdxTranslationPairs,
  mergeSdxTranslations,
  mergeStoredAndCachedTranslations,
  patchSdxTranslatedMenu,
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

  it('does not collect a description that repeats the dish name', () => {
    const strings = collectSdxTranslatableStrings([makeMenu('White Rice')]);
    assert.deepEqual(strings, ['Lunch', 'Entrees', 'White Rice']);
  });

  it('collapses case and spacing variants of the same dish', () => {
    const strings = collectSdxTranslatableStrings([
      makeMenu('BBQ Beef Brisket'),
      makeMenu('Bbq Beef Brisket'),
      makeMenu('BBQ  Beef Brisket'),
    ]);
    assert.deepEqual(strings, ['Lunch', 'Entrees', 'BBQ Beef Brisket']);
  });
});

describe('extractSdxTranslationPairs', () => {
  it('pairs matching English and translated menus', () => {
    const english = makeMenu('Garlic Chicken');
    const translated: FilteredSodexoMeal[] = [{
      name: '昼食',
      groups: [{
        name: '主菜',
        items: [{
          ...sampleItem,
          formalName: 'ガーリックチキン',
          description: 'にんにくチキン',
        }],
      }],
    }];

    assert.deepEqual(extractSdxTranslationPairs(english, translated), [
      ['Lunch', '昼食'],
      ['Entrees', '主菜'],
      ['Garlic Chicken', 'ガーリックチキン'],
    ]);
  });

  it('returns no pairs when menu shapes differ', () => {
    const english = makeMenu('Garlic Chicken');
    const translated: FilteredSodexoMeal[] = [{
      name: '昼食',
      groups: [],
    }];

    assert.deepEqual(extractSdxTranslationPairs(english, translated), []);
  });
});

describe('mergeSdxTranslations', () => {
  it('prefers cached strings and fills the rest from a fresh batch', () => {
    const merged = mergeSdxTranslations(
      ['Lunch', 'Garlic Chicken', 'White Rice'],
      new Map([['Lunch', '昼食']]),
      ['Garlic Chicken', 'White Rice'],
      ['ガーリックチキン', '白米'],
    );

    assert.deepEqual(merged, ['昼食', 'ガーリックチキン', '白米']);
  });
});

describe('mergeStoredAndCachedTranslations', () => {
  it('lets table corrections overwrite stored menu translations', () => {
    const merged = mergeStoredAndCachedTranslations(
      [['Garlic Chicken', 'ガーリックチキン'], ['Lunch', '昼食']],
      new Map([['Garlic Chicken', 'にんにくチキン']]),
    );

    assert.equal(merged.get('Garlic Chicken'), 'にんにくチキン');
    assert.equal(merged.get('Lunch'), '昼食');
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

describe('patchSdxTranslatedMenu', () => {
  const english: FilteredSodexoMeal[] = [{
    name: 'Lunch',
    groups: [{
      name: 'Entrees',
      items: [
        { ...sampleItem, formalName: 'Garlic Chicken', description: 'Chicken with garlic' },
        { ...sampleItem, formalName: 'White Rice', description: 'White Rice' },
      ],
    }],
  }];

  const translated: FilteredSodexoMeal[] = [{
    name: '昼食',
    groups: [{
      name: '主菜',
      items: [
        { ...sampleItem, formalName: 'ガーリックチキン', description: 'にんにくのチキン' },
        { ...sampleItem, formalName: '白米', description: '白米' },
      ],
    }],
  }];

  it('patches one correction and leaves other stored translations intact', () => {
    const patched = patchSdxTranslatedMenu(
      english,
      translated,
      new Map([['Garlic Chicken', 'にんにくチキン']]),
    );

    assert.equal(patched?.[0].name, '昼食');
    assert.equal(patched?.[0].groups[0].name, '主菜');
    assert.equal(patched?.[0].groups[0].items[0].formalName, 'にんにくチキン');
    assert.equal(patched?.[0].groups[0].items[0].description, 'にんにくのチキン');
    assert.equal(patched?.[0].groups[0].items[1].formalName, '白米');
  });

  it('does not rewrite a mismatched menu into English', () => {
    const mismatched: FilteredSodexoMeal[] = [{
      name: '昼食',
      groups: [],
    }];

    const patched = patchSdxTranslatedMenu(
      english,
      mismatched,
      new Map([['Garlic Chicken', 'にんにくチキン']]),
    );

    assert.deepEqual(patched, mismatched);
  });
});
