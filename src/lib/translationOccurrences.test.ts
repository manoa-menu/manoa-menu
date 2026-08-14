import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  collectCcOccurrences,
  collectSdxOccurrences,
  createOccurrenceIndex,
  formatOccurrenceDates,
  formatTranslationOccurrences,
  getTranslationOccurrences,
  isoDateFromWeekAndDayName,
} from './translationOccurrences';
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

describe('translation occurrences', () => {
  it('turns a Campus Center week and day name into a calendar date', () => {
    assert.equal(isoDateFromWeekAndDayName('2026-08-09', 'Monday (8/11)'), '2026-08-10');
    assert.equal(isoDateFromWeekAndDayName('2026-08-09', 'Thursday'), '2026-08-13');
  });

  it('formats consecutive dates as a range', () => {
    assert.equal(formatOccurrenceDates(['2026-08-13']), '8/13');
    assert.equal(
      formatOccurrenceDates(['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-14']),
      '8/10–8/12, 8/14',
    );
  });

  it('records location and calendar date for dishes and descriptions', () => {
    const index = createOccurrenceIndex();
    collectSdxOccurrences(sdxMenu, 'GW', '2026-08-13', index);
    collectSdxOccurrences(sdxMenu, 'HA', '2026-08-10', index);
    collectCcOccurrences([{
      name: 'Monday',
      plateLunch: ['Garlic Chicken'],
      grabAndGo: [],
      specialMessage: '',
    }] as DayMenu[], '2026-08-09', index);

    const garlic = getTranslationOccurrences(index, 'Garlic Chicken');
    assert.deepEqual(garlic, [
      { location: 'GW', dates: ['2026-08-13'] },
      { location: 'HA', dates: ['2026-08-10'] },
      { location: 'CC', dates: ['2026-08-10'] },
    ]);
    assert.equal(
      formatTranslationOccurrences(garlic),
      'GW 8/13 · HA 8/10 · CC 8/10',
    );
    assert.equal(
      formatTranslationOccurrences(getTranslationOccurrences(index, 'Chicken breast seasoned with garlic.')),
      'GW 8/13 · HA 8/10',
    );
  });
});
