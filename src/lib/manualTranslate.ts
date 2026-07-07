import { MenuResponse, DayMenu } from '@/types/menuTypes';

const jpDaysOfWeek = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];

type SubstringReplacement = {
  from: string | RegExp;
  to: string;
};

/**
 * A rule returns the replaced string, or `null` when it doesn't apply to the item.
 * Rules are evaluated in order and the first one that applies wins (mutually exclusive),
 * matching the original early-return behavior.
 */
type ReplaceRule = (item: string) => string | null;

const toRules = (replacements: SubstringReplacement[]): ReplaceRule[] => replacements.map(
  ({ from, to }) => (item) => {
    const result = item.replace(from, to);
    return result === item ? null : result;
  },
);

const SHARED_REPLACEMENTS: SubstringReplacement[] = [
  { from: 'チキンブルスケッタサラダ（ブルスケッタ風味のチキンサラダ）', to: 'チキンブルスケッタサラダ（トマトを使ったブルスケッタ風チキンサラダ）' },
  { from: 'ブラックビーンシュリンプ（黒豆入りえび炒め）と焼きそば', to: 'ブラックビーンシュリンプ（黒豆ソースの中華風えび炒め）' },
  { from: 'チキンシーザー ベーコンラップ', to: 'チキンシーザー＆ベーコンラップ' },
  { from: 'スイート＆サワーフィッシュ（甘酢味の白身魚）とチャーハン', to: '甘酢白身魚とチャーハン' },
  { from: 'バリューボウル', to: 'バリューボウル (ミニボウル)' },
  { from: '丼', to: 'ボウル' },
  { from: /(.*クラブ)$/, to: '$1サンドイッチ' },
  { from: /テイタートッツ|テイタートット|テイタートツ|タタートッツ/g, to: 'ポテトフライド' },
  { from: 'ロード', to: 'トッピング盛りだくさん' },
  { from: 'ミックスプレート', to: 'ミックスプレート (選べる2種盛りプレート)' },
];

const rules = toRules(SHARED_REPLACEMENTS);

const applyRules = (item: string): string => {
  for (const rule of rules) {
    const replaced = rule(item);
    if (replaced !== null) {
      console.log(`[manualTranslate] Changed: "${item}" -> "${replaced}"`);
      return replaced;
    }
  }
  return item;
};

const replaceDayMenu = (dayMenu: DayMenu, index: number): DayMenu => ({
  name: jpDaysOfWeek[index],
  plateLunch: dayMenu.plateLunch.map(applyRules),
  grabAndGo: dayMenu.grabAndGo.map(applyRules),
  specialMessage: dayMenu.specialMessage,
});

const jpManualReplace = (original: MenuResponse): MenuResponse => ({
  weekOne: original.weekOne.map(replaceDayMenu),
  weekTwo: (original.weekTwo ?? []).map(replaceDayMenu),
});

export default jpManualReplace;
