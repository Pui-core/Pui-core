# 音桜夢 初ビンゴ / V4

V2の暗いステージ、ミントとピンク、150BPMの切り返しを戻し、動く対象を文字・図形・盤面へ集めた22秒の告知です。立ち絵は通常の背景透過だけを施し、全編で固定します。

**TikTok投稿には `osayu-bingo-v4-1124-tiktok-silent.mp4` を使い、音源はTikTok内で追加してください。** `osayu-bingo-v4-1124.mp4` は仮BGM入りの動作確認版です。選定曲・使用区間・合わせ位置は [音源後付けガイド](音源後付けガイド.md) にあります。

## 演出と内容

- 0–3.2秒：「ねえ、」「おさゆに、」「何て言わせる？」。大きな文字と疑問符カードで問いを作ります。
- 3.2–8秒：ミントの反転で一列ごとのリクエストセリフ、続けて初見20人・おはさゆ20回の参加目標。
- 8–12.8秒：9つの目標へ集約し、初見→挨拶のマスへ寄ってから全体へ戻ります。
- 12.8–16秒：全マス達成で歌ってみたのサビを後日投稿。一緒に初めての一列を作る呼びかけ。
- 16–22秒：日付→時刻→同時表示へ着地。最後はプロフィールから配信へ案内します。

9目標は「初見20人／いいね100K／シェア10回／ギフト20個・なんでもOK／ミンカベア1個／フォロー10人／ハートミー15個／おはさゆ20回／同事務所凸5人」。達成実績や残数としては見せません。11/24 22:00はowner確認済みです。

## 素材と編集原本

元素材はローカルのみ。`character-original.jpg` は元JPEGのコピー、`character-cutout.png` は非AIの外周白アルファ除去です。[素材制約](asset-policy.md) と `qa/transparency-audit.json` を参照してください。V2の生成ポーズは使用しません。

EffectCraftに文字・盤面・図形のアニメーション、FilmCraftに無音映像とオリジナルBGMを保存しています。音源はV2と同じ自作合成スコアです。本人の声は含みません。

`text-only.ecproj` はキャラをimportせず、承認背景と配置用の矩形で画面を確認する原本です。**キャラ入りの原本・映像・静止画・透過PNGをAIへ入力しないでください。** 矩形は確認版だけに表示されます。

## 再生成

Linux側の独立worktreeから実行します。EffectCraft、FilmCraft、Windows版ImageMagick/FFmpegと対象ローカル素材が必要です。

```sh
node transparency.mjs /home/pui/Videos/Osayu-Bingo/2026-10-24/revision-04
node produce.mjs prepare
node produce.mjs previews
node produce.mjs render
node produce.mjs verify
node post-audio.mjs
node package.mjs
```

既定の制作先：`/home/pui/Videos/Osayu-Bingo/2026-10-24/revision-04`。納品先：`F:\Users\pui\Documents\gara\bingo-1124-v4`。旧版は保持します。BGMは既存V2の `normalized.wav` をコピーするか、`node audio.mjs <root>` で再生成します。

## 投稿文案

おさゆに、何て言わせる？👀

初ビンゴ、一列そろうたびにリクエストセリフ！
初見さんも「おはさゆ」のひと言から参加してね。
全マス達成したら、歌ってみたのサビを後日投稿🎤

11/24 22:00 TikTok LIVE
プロフィールから遊びにきてね🌸

#音桜夢 #おさゆ #ビンゴ #TikTokLIVE #Vライバー

## 確認範囲

実施結果は `validation.json` とローカル `qa/` に記録します。元JPEG保持・透過後RGB同一性・固定レイヤー構造・最終動画デコードと音量、キャラ未読込の別原本の目視、納品先での原本再読込・再描画を区別します。キャラ入り出力のAI目視、全編の人間による実時間視聴・試聴、実機TikTok UI、集客効果は確認済みと扱いません。SNS投稿は行いません。
