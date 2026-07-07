import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import jpManualReplace from './manualTranslate';
import type { DayMenu, MenuResponse } from '../types/menuTypes';

const makeDayMenu = (plateLunch: string[], grabAndGo: string[]): DayMenu => ({
  name: 'Monday',
  plateLunch,
  grabAndGo,
  specialMessage: 'Closed for holiday',
});

const makeMenu = (weekOne: DayMenu[], weekTwo: DayMenu[] = []): MenuResponse => ({
  weekOne,
  weekTwo,
});

describe('jpManualReplace', () => {
  it('replaces dish-specific translations', () => {
    const result = jpManualReplace(makeMenu([
      makeDayMenu(
        [
          'チキンブルスケッタサラダ（ブルスケッタ風味のチキンサラダ）',
          'ブラックビーンシュリンプ（黒豆入りえび炒め）と焼きそば',
          'スイート＆サワーフィッシュ（甘酢味の白身魚）とチャーハン',
        ],
        ['チキンシーザー ベーコンラップ'],
      ),
    ]));

    assert.equal(
      result.weekOne[0].plateLunch[0],
      'チキンブルスケッタサラダ（トマトを使ったブルスケッタ風チキンサラダ）',
    );
    assert.equal(
      result.weekOne[0].plateLunch[1],
      'ブラックビーンシュリンプ（黒豆ソースの中華風えび炒め）',
    );
    assert.equal(result.weekOne[0].plateLunch[2], '甘酢白身魚とチャーハン');
    assert.equal(result.weekOne[0].grabAndGo[0], 'チキンシーザー＆ベーコンラップ');
  });

  it('applies shared substring replacements to plate lunch and grab-and-go', () => {
    const result = jpManualReplace(makeMenu([
      makeDayMenu(
        ['バリューボウル with chicken', 'ミニまたは丼', 'Turkey with グレービー'],
        ['テイタートッツ side', 'ロード fries', 'ミックスプレート', 'Turkeyクラブ'],
      ),
    ]));

    assert.equal(result.weekOne[0].plateLunch[0], 'お得サイズボウル with chicken');
    assert.equal(result.weekOne[0].plateLunch[1], 'ミニまたはボウル');
    assert.equal(result.weekOne[0].plateLunch[2], 'Turkey with グレイビーソース');
    assert.equal(result.weekOne[0].grabAndGo[0], 'ポテトフライド side');
    assert.equal(result.weekOne[0].grabAndGo[1], 'トッピング盛りだくさん fries');
    assert.equal(result.weekOne[0].grabAndGo[2], '２種類プレート');
    assert.equal(result.weekOne[0].grabAndGo[3], 'Turkeyクラブサンドイッチ');
  });

  it('does not let the generic blackened rule override dish-specific black bean shrimp', () => {
    const result = jpManualReplace(makeMenu([
      makeDayMenu(
        ['ブラックビーンシュリンプ（黒豆入りえび炒め）と焼きそば'],
        [],
      ),
    ]));

    assert.equal(
      result.weekOne[0].plateLunch[0],
      'ブラックビーンシュリンプ（黒豆ソースの中華風えび炒め）',
    );
    assert.doesNotMatch(result.weekOne[0].plateLunch[0], /味付鶏肉/);
  });

  it('applies the blackened rule to other items containing ブラック', () => {
    const result = jpManualReplace(makeMenu([
      makeDayMenu([], ['ブラックニングチキン']),
    ]));

    assert.equal(result.weekOne[0].grabAndGo[0], 'ブラック（味付鶏肉）ニングチキン');
  });

  it('sets Japanese day names and preserves special messages', () => {
    const result = jpManualReplace(makeMenu([
      makeDayMenu(['unchanged item'], []),
      makeDayMenu(['also unchanged'], []),
    ]));

    assert.equal(result.weekOne[0].name, '月曜日');
    assert.equal(result.weekOne[1].name, '火曜日');
    assert.equal(result.weekOne[0].specialMessage, 'Closed for holiday');
  });

  it('processes week two when present and handles missing week two', () => {
    const withWeekTwo = jpManualReplace(makeMenu(
      [makeDayMenu(['ミニまたは丼'], [])],
      [makeDayMenu(['バリューボウル'], [])],
    ));
    const withoutWeekTwo = jpManualReplace({
      weekOne: [makeDayMenu(['unchanged'], [])],
      weekTwo: undefined as unknown as DayMenu[],
    });

    assert.equal(withWeekTwo.weekTwo[0].name, '月曜日');
    assert.equal(withWeekTwo.weekTwo[0].plateLunch[0], 'お得サイズボウル');
    assert.equal(withoutWeekTwo.weekTwo.length, 0);
  });

  it('leaves unmatched items unchanged', () => {
    const result = jpManualReplace(makeMenu([
      makeDayMenu(['Regular plate lunch'], ['Regular grab and go']),
    ]));

    assert.equal(result.weekOne[0].plateLunch[0], 'Regular plate lunch');
    assert.equal(result.weekOne[0].grabAndGo[0], 'Regular grab and go');
  });
});
