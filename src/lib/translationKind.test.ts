import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  classifyTranslationKind,
  collectCcTranslationKinds,
  collectSdxTranslationKinds,
  createTranslationKindCatalog,
  parentDishForSource,
} from './translationKind';
import { parseTranslationKind } from './translationReviewShared';
import type { DayMenu, FilteredSodexoMeal } from '../types/menuTypes';

const sdxMenu: FilteredSodexoMeal[] = [{
  name: 'Lunch',
  groups: [{
    name: 'Entrees',
    items: [{
      course: null,
      meal: 'LUNCH',
      formalName: 'Garlic Chicken',
      description: 'Chicken breast seasoned with garlic.',
      isVegan: false,
      isVegetarian: false,
    }],
  }],
}];

const ccMenu: DayMenu[] = [{
  name: 'Monday',
  plateLunch: ['Kalua Pig'],
  grabAndGo: ['Caesar Salad'],
  specialMessage: 'Closed for holiday.',
}];

describe('translation kinds', () => {
  it('collects dish names and descriptions from SDX and CC menus', () => {
    const catalog = createTranslationKindCatalog();
    collectSdxTranslationKinds(sdxMenu, catalog);
    collectCcTranslationKinds(ccMenu, catalog);

    assert.equal(classifyTranslationKind('Garlic Chicken', catalog), 'dish');
    assert.equal(classifyTranslationKind('Entrees', catalog), 'dish');
    assert.equal(classifyTranslationKind('Kalua Pig', catalog), 'dish');
    assert.equal(
      classifyTranslationKind('Chicken breast seasoned with garlic.', catalog),
      'description',
    );
    assert.equal(classifyTranslationKind('Closed for holiday.', catalog), 'description');
    assert.equal(
      parentDishForSource('Chicken breast seasoned with garlic.', catalog),
      'Garlic Chicken',
    );
  });

  it('treats a copied dish name as a dish, not a description', () => {
    const catalog = createTranslationKindCatalog();
    collectSdxTranslationKinds([{
      name: 'Lunch',
      groups: [{
        name: 'Grill',
        items: [{
          course: null,
          meal: 'LUNCH',
          formalName: 'White Rice',
          description: 'White Rice',
          isVegan: true,
          isVegetarian: true,
        }],
      }],
    }], catalog);

    assert.equal(classifyTranslationKind('White Rice', catalog), 'dish');
    assert.equal(parentDishForSource('White Rice', catalog), null);
  });

  it('falls back to length for strings missing from stored menus', () => {
    const catalog = createTranslationKindCatalog();
    assert.equal(classifyTranslationKind('Poke', catalog), 'dish');
    assert.equal(
      classifyTranslationKind('Fresh ahi tossed with onion, soy, and sesame oil.', catalog),
      'description',
    );
  });

  it('parses kind filters', () => {
    assert.equal(parseTranslationKind('dish'), 'dish');
    assert.equal(parseTranslationKind('description'), 'description');
    assert.equal(parseTranslationKind('nope'), 'all');
  });
});
