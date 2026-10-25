# 同じ歌、余韻を減らすと？

[23.1秒のMIX比較](videos/mix-process.mp4) / [カバー](covers/mix-process-cover.png) / [再生ページ](index.html)

10/27向けの先行制作候補です。medicateのV5/V6を同じ21.30〜25.20秒から取り、A→Bを2回聴き比べる構成にしました。本人が記録に残した「フックリバーブかけすぎ」「自然な強弱を優先したい」という要望と、V6比較の「このバランスでよい」を軸にしています。架空のDAWやチャット画面、未収録の手作業・感情は使いません。

## 比較の条件

元の24.3秒matched previewは、ownerが比較した区間とA−0.33dB/B0dBの根拠です。その終端33.5秒には実dryのエネルギーが残り、次のtimed cueの途中に当たるため、新動画の語尾cutへ流用しませんでした。既存の修正済み05の境界確認と実PCMを参照し、元24bit WAVから21.30〜25.20秒を直接切り出しています。数値とtimed cueは、意味の通る句や聴感を直接試聴した証明ではありません。

| 出力時刻 | 内容 |
| --- | --- |
| 0〜2.4秒 | 問いと比較の案内 |
| 2.4〜6.3秒 | A / V5 |
| 6.3〜7.0秒 | Bへの切替 |
| 7.0〜10.9秒 | B / V6 |
| 10.9〜11.6秒 | 「もう一度」 |
| 11.6〜15.5秒 | 同じA / V5 |
| 15.5〜16.2秒 | Bへの切替 |
| 16.2〜20.1秒 | 同じB / V6 |
| 20.1〜23.1秒 | 制作記録の選択と締め |

速度1倍、Aの相対trim−0.33dB/B0dB、共通gain−1dB。両方に同じ100msの導入・10msの末尾envelopeを適用し、追加の個別正規化は行いません。fade区間は実dryの低い境界へ置き、旧cutで落ちた25.10〜25.19秒も残します。前後の無音と0.7秒の切替は意図した構成です。比較中に別BGM・SE・ナレーションを重ねません。

V5/V6はリバーブとマスターの強弱処理を含む実MIX比較です。リバーブだけを変えた単一条件の実験ではありません。2回のA、2回のBはそれぞれPCM一致。波形は実際に再生するPCMから同じ128区間・同じ時間軸・共通振幅軸で描き、勝手に片側を大きく見せていません。

## モデルとCraft原本

指定Revenant_NaturalのMOC SHA `6b63e0fcd6c8bc5142689ab5c0d2340b2fe59d5124e57290dd438c2ec01ad03e` を既設の正式Cubism Core 06.00.0513で実ロードし、180枚・6秒の透過loopを一度描画しました。口は全フレームで閉じ、瞬き・微小な首/呼吸だけを編集しています。歌や伴奏で口を動かさず、本人の歌唱実演・カメラ追跡・VTS物理とは扱いません。

Coreで得た実メッシュとatlasをソフトウェア描画するMIT utilityだけを既存97から再利用しています。著作権表示は `source/live2d-renderer-LICENSE.txt` に保持。モデル・SDKのrawデータは同梱/公開せず、稼働中の配信環境を操作しません。論理framingと描画上の制約は97の手順を参照し、本候補の実フレームで検証しています。

- PhotoCraft: `projects/wave-A.pcraft`、`wave-B.pcraft`、`covers/mix-process-cover.pcraft`。実PCM波形とモデル入り表紙。
- EffectCraft: `projects/mix-process.ecproj`。案内役、比較表示、同じsource時刻に対応するカーソルと切替。
- FilmCraft: `projects/mix-process.fcproj`。実映像と比較音声を一度ずつ配置。

最初のカーソルは時刻表示へ重なったため、波形内で終わる高さへ短縮しました。修正後の保存ECと最終MP4を再確認しています。モデルloop179→180等の境界は最終encoded ROIと抽出画像で検査し、頭部余白は全180枚で24px、頭部端接触0です。

## 納品・確認・公開前の残件

納品先は `F:\Videos\ProjectP-Mix-Process-2026-10-27\revision-01-live2d`。原本再読込に必要な描画済み連番・alpha loop・映像中間・比較mixをそろえ、Fから3Craft原本を再読込・保存・描画し、素材欠損0とSHA対応を確認しました。原曲全体・raw beat/stems・モデル原本・SDKは新たに公開Gitへ追加しません。公開checkoutでは無視した大きな中間をrecipeから再生成します。

最終1080×1920/30fps/693枚、全AVdecode、AAC音量/peak・4区間の波形対応とlag、同じPCM反復、重要な切替とmodel loop、表紙中央3:4の可読性を確認しました。証跡は `qa/technical.json`、`audio-final.json`、`final-frame-binding.json`、`model-loop-final.json`、`delivery.json`。これらは数値・抽出画像・原本再読込の確認です。

**主観的な全編直接試聴、実TikTokプレビュー、10/27当日の活動・前投稿分析・創作採用・公開receiptは未確認です。** 制作候補の完了と、その日の採用・投稿を区別します。今回の曲は本人の比較対象で、97の外部人気曲選定条件を本回の追加承認ゲートへ持ち込みません。作者表記は確認済みの「曲・歌・MV：ぷい」。beat単独作曲や歌詞作者の独立した帰属、全権利保有など、記録にない範囲へ広げません。

管理: [制作#99](https://github.com/Pui-core/-/issues/99) / [継続目標#93](https://github.com/Pui-core/-/issues/93)

## 再生成

既設Windows Craft/FFmpeg、Core/JVM、ローカルの指定モデルと元V5/V6が必要です。新しいSDKのdownload/規約同意・グローバル導入は行いません。`source/edit.json` の入力を確認し、別の新しい保存先で実行してください。

```bash
node source/model.mjs
node source/audio-assets.mjs
node source/picture.mjs
node source/render.mjs
node source/verify.mjs
node source/package.mjs
```

既にあるmodel連番は保全し、`model.mjs`を重ねて実行しません。F納品が既にある場合は、意図を確認してから `source/finalize-delivery.mjs` で変更分だけを反映/再検証します。
