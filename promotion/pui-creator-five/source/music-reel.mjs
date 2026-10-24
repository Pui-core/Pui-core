/**
 * Owner-confirmed work: medicate, song / singing / MV made by Pui.
 * This does not identify the photographed person or credit Pui with the beat alone.
 * Picture and singing use the same existing Highlight range without source jumps.
 */
const highlight='/mnt/e/Desktop/音源/medicate/MV_v3_ArtistLyrics/medicate_MV_v3_Highlight.mp4';
const label='medicate / 曲・歌・MV：ぷい';
const shot=(a,b,caption,mode='portrait')=>({
  a,b,source:highlight,at:a,caption,label,mode,cx:0,
  camera:'source',
});

export const musicReel={
  id:'05',
  slug:'medicate-made-by-pui',
  title:'曲も、歌も、映像も。',
  duration:21.6,
  audio:highlight,
  audioAt:0,
  audioPolicy:'preserve-approved-excerpt',
  creatorCredit:'曲・歌・MV：ぷい',
  sourceNote:'既存HighlightのVerse2抜粋。人物写真をぷい本人と断定せず、曲と歌と映像の作品として見せる。',
  shots:[
    shot(0,1.8,'曲も、歌も、映像も。'),
    shot(1.8,19.2,''),
    shot(19.2,21.6,'','end'),
  ],
  editorialIntent:{
    opening:'最初の1.8秒だけ上部へ短い制作コピー。既存の下部歌詞を妨げない。',
    body:'17.4秒は新しい説明や歌詞を足さず、元MVの写真・歌詞・実歌を連続して楽しむ。',
    ending:'最後の2.4秒で元MVを少し暗くし、ぷいの署名。実歌は21.6秒まで同じsource rangeを保つ。',
    camera:'既存MVのカメラを維持し、shot境界で追加のpunch zoomを掛けない。',
    audio:'承認済みV6を使う元MVの音を再mix/pitch補正/動的正規化せず、必要な短いedgefadeだけ。最終AACで別途計測する。',
  },
};
