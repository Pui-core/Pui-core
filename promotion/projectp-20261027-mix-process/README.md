# 同じ歌、余韻を減らすと？ / revision02

[23.1秒のMIX比較](videos/mix-process.mp4) / [カバー](covers/mix-process-cover.png) / [再生ページ](index.html)

10/26向けの予約候補です（19:15 JST予定、実予約は未実施）。元の10/27候補から現在の予定日を変更し、制作folder/F納品pathの日付27は履歴識別子として保持しています。初版の実TikTokプレビューで波形右端へavatar/heart列が重なったため、revision02では比較カード・波形・時刻軸・カーソルを共通の横変換で収め直しました。**新版の実TikTok各対象場面をrootが確認し、波形端のP2を解除しました。** medicateのV5/V6を同じ21.30〜25.20秒から取り、A→Bを2回聴き比べる構成にしました。本人が記録に残した「フックリバーブかけすぎ」「自然な強弱を優先したい」という要望と、V6比較の「このバランスでよい」を軸にしています。架空のDAWやチャット画面、未収録の手作業・感情は使いません。

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

指定Revenant_NaturalのMOC SHA `6b63e0fcd6c8bc5142689ab5c0d2340b2fe59d5124e57290dd438c2ec01ad03e` を既設の正式Cubism Core 06.00.0513で実ロードし、初版で180枚・6秒の透過loopを一度描画しました。revision02では同じ連番とalpha動画をFの初版から再利用し、Coreを再描画していません。口は全フレームで閉じ、瞬き・微小な首/呼吸だけを編集しています。歌や伴奏で口を動かさず、本人の歌唱実演・カメラ追跡・VTS物理とは扱いません。

Coreで得た実メッシュとatlasをソフトウェア描画するMIT utilityだけを既存97から再利用しています。著作権表示は `source/live2d-renderer-LICENSE.txt` に保持。モデル・SDKのrawデータは同梱/公開せず、稼働中の配信環境を操作しません。論理framingと描画上の制約は97の手順を参照し、本候補の実フレームで検証しています。

- PhotoCraft: `projects/wave-A.pcraft`、`wave-B.pcraft`、`covers/mix-process-cover.pcraft`。実PCM波形とモデル入り表紙。
- EffectCraft: `projects/mix-process.ecproj`。案内役、比較表示、同じsource時刻に対応するカーソルと切替。
- FilmCraft: `projects/mix-process.fcproj`。実映像と比較音声を一度ずつ配置。

初版でカーソルが時刻表示へ重なったため、カーソルは波形内で終わる高さへ短縮済みです。修正後の保存ECと最終MP4を再確認しています。モデルloop179→180等の初版encoded ROI検査は同じloop素材/配置の根拠として保持し、新版で再計測したものとは扱いません。頭部余白は全180枚で24px、頭部端接触0です。

## 実TikTokでの波形端とrevision02の修正

初版のnative A1/B1/A2/B2では右端の数%の波形に操作列が重なりました。9枚の対象phone/cover cropと原packetは `qa/native99-revision01-result.json` に旧master/coverのSHAのまま保存しています。初版の見出し・顔・A/B・creditが読める事実と、波形全体の未達を分けます。

新版は `x′ = 54 + (x - 54) × 0.85` をA/B共通に適用。カードはx54〜880.2、data/cursorはx115.2〜800.64へ収まり、縦方向の振幅・全128区間・同じ時間軸・音源のcueを維持しています。データをcropしていません。cover/比較PCM/Core素材は不変です。新MP4の全decode・4AAC窓のlag・対象encoded96/231/375/513とF原本の再読込を確認しました。さらにrootの実native paused約5秒のA1・約8秒のB1・約12秒のA2・約17秒のB2、締め/23秒終端・coverで波形端が操作列より左へ収まることを確認しています。証跡は `qa/native99-revision02-binding.json`。名目3.2秒のA1撮影はまだ導入を表示していたためA1根拠にせず、補足の実paused約5秒を採用しました。実UIのframe精度の音声同期や連続全コマの確認ではありません。

## 納品・確認・公開前の残件

納品先は `F:\Videos\ProjectP-Mix-Process-2026-10-27\revision-02-native-safe`。初版 `revision-01-live2d` とmaster SHA `68e6ee6f…109a625` は保持し上書きしません。原本再読込に必要な描画済み連番・alpha loop・映像中間・比較mixをそろえ、Fから3Craft原本を再読込・保存・描画し、素材欠損0とSHA対応を確認しました。原曲全体・raw beat/stems・モデル原本・SDKは新たに公開Gitへ追加しません。公開checkoutでは無視した大きな中間をrecipeから再生成します。

最終1080×1920/30fps/693枚、全AVdecode、AAC音量/peak・4区間の波形対応とlag、同じPCM反復、重要な切替とmodel loop、表紙中央3:4の可読性を確認しました。証跡は `qa/technical.json`、`audio-final.json`、`final-frame-binding.json`、`model-loop-final.json`、`delivery.json`。これらは数値・抽出画像・原本再読込の確認です。

**主観的な全編直接試聴、10/26当日の活動・前投稿分析・最終採用、実予約/公開receiptは未確認です。** rootの準備画面は既存許可の予約前確認でACTIVEです。coverは準備内で保存しましたが、下書き保存ボタン・予約submitは未実行、破棄もしていません。対象account/privacy/disclosure等の実確認と最新版PRのreview/merge後に単独publisherが一度だけ予約する予定で、制作結果を予約済み・公開済みとは扱いません。 制作候補の完了と、その日の採用・投稿を区別します。今回の曲は本人の比較対象で、97の外部人気曲選定条件を本回の追加承認ゲートへ持ち込みません。作者表記は確認済みの「曲・歌・MV：ぷい」。beat単独作曲や歌詞作者の独立した帰属、全権利保有など、記録にない範囲へ広げません。

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
