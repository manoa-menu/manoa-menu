/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

import '@/styles/Menu.css';

import getCheckCCMenu from '@/lib/menuActions';
import MenuList from '@/components/MenuList';
import { Container } from 'react-bootstrap';

interface DayMenu {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  specialMessage: string;
}

const Page = async () => {
  const parsedMenu: DayMenu[] = await getCheckCCMenu('Japanese', 'Japan');
  const jpnTest: DayMenu[] = [
    {
      name: '月曜日',
      grabAndGo: [
        'ブラックチキンシーザー',
        'アボカドチキンサラダ',
        'バッファローチキンラップ',
        'ターキーグアカモーレラップ',
        'ブラックチキンシーザー',
        'アボカドチキンサラダ',
        'バッファローチキンラップ',
        'ターキーグアカモーレラップ',
      ],
      plateLunch: [
        '日本風ビーフカレー',
        '鶏の唐揚げ',
        '酒で照り焼きしたサーモン',
        'ミックスプレート：ビーフカレーと鶏の唐揚げ',
        'ミニまたは丼：ビーフカレーまたは鶏の唐揚げ',
        'お得サイズボウル：ベジタリアンラザニア',
      ],
      specialMessage: '',
    },
    {
      name: '火曜日',
      grabAndGo: [
        'コブサラダ',
        'アジアンビーフサラダ',
        'ベーコン付きチキンシーザーラップ',
        'メキシカンビリアビーフラップ',
        'コブサラダ',
        'アジアンビーフサラダ',
        'ベーコン付きチキンシーザーラップ',
      ],
      plateLunch: [
        'チキンパルメザンとチャバタブレッド',
        'イタリアンローストビーフ',
        'イタリアンソーセージ',
        'ミックスプレート：イタリアンソーセージとローストビーフ',
        'ミニまたは丼：イタリアンソーセージまたはローストビーフ',
        'お得サイズボウル：マリナーラソースのペンネパスタ',
      ],
      specialMessage: '',
    },
    {
      name: '水曜日',
      grabAndGo: [
        'イタリアンチョップドサラダ',
        'BBQチキンサラダ',
        'チポトレチキンラップ',
        'カリフォルニアチキンクラブラップ',
        'イタリアンチョップドサラダ',
        'BBQチキンサラダ',
        'チポトレチキンラップ',
        'カリフォルニアチキンクラブラップ',
      ],
      plateLunch: [
        'BBQビーフブリスケットとコーンブレッド',
        'グアバBBQポークリブ',
        'ロティサリーチキン',
        'ミックスプレート：BBQビーフブリスケットとポークリブ',
        'ミニまたは丼：BBQブリスケットまたはポークリブ',
        'お得サイズボウル：南西スタイルマック＆チーズ（チーズソースと唐辛子のパスタ）',
      ],
      specialMessage: '',
    },
    {
      name: '木曜日',
      grabAndGo: [
        'チキンブルスケッタサラダ',
        'エビシーザーサラダ',
        'チキンペストラップ',
        'チキンベーコンランチラップ',
        'チキンブルスケッタサラダ',
        'エビシーザーサラダ',
        'チキンペストラップ',
        'チキンベーコンランチラップ',
      ],
      plateLunch: [
        'チャーシュー豚',
        'ブラックビーンチキン炒め',
        'チャイナタウン風スワイ魚',
        '点心プレート：焼きそば、スプリングロール、チャーシューパオ、シューマイ',
        'ミックスプレート：チキン炒めとチャーシュー',
        'ミニまたは丼：チキン炒めまたはチャーシュー',
        'お得サイズボウル：スプリングロール添え炒飯',
      ],
      specialMessage: '',
    },
    {
      name: '金曜日',
      grabAndGo: [
        'ギリシャ風サラダ',
        'チョップドサラダ',
        'ターキークラブサンドイッチ',
        'ターキーチポトレBLTラップ',
        'ギリシャ風サラダ',
        'チョップドサラダ',
        'ターキークラブサンドイッチ',
        'ターキーチポトレBLTラップ',
      ],
      plateLunch: [
        'ラウラウ',
        'カルアポーク',
        'フリフリチキン（ハワイのBBQ風味の丸焼きチキン）',
        'ミックスプレート：ラウラウとカルアポークとポイ（タロイモペースト）',
        'ミニまたは丼：ラウラウまたはカルアポーク',
        'お得サイズボウル：ハワイ風チョップステーキとライス',
      ],
      specialMessage: '',
    },
  ];
  return (
    (parsedMenu !== null && parsedMenu !== undefined) ? (
      <Container fluid className="my-5 menu-container">
        <h1>Menu</h1>
        <MenuList menu={parsedMenu} />
      </Container>
    ) : (
      <Container fluid className="my-5 menu-container">
        <h1>Menu</h1>
        <p>Menu not available</p>
      </Container>
    )
  );
};

export default Page;
