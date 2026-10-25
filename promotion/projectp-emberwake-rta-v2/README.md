# EMBERWAKE 追従RTA版 V2

[動画を再生](index.html) / [MP4](videos/01-emberwake-rta-v2.mp4) / [台本](source/%E5%8F%B0%E6%9C%AC-%230089EMBERWAKE%E8%BF%BD%E5%BE%93RTA%E7%89%88.md) / [投稿文](source/%E6%8A%95%E7%A8%BF%E6%96%87.json)

「その一手で、何秒縮める？」。EMBERWAKEの章別TIME ATTACKとローカル自己ベストを前面に、主人公・芯石・着地点を追う60秒版です。作者ぷいの本制作とCAMPFIREでの応援へつなぎます。60.000秒、1800フレーム、1080×1920、30fps、18カット。

## 機能紹介と映像の区別

根拠は [qa/rta-source.json](qa/rta-source.json)。

- 章ごとの固定コースに挑むTIME ATTACKとローカル自己ベストは実装に基づく紹介です。オンラインランキングや全章通算タイマーはありません。
- TIME ATTACK項目は実タイトル画面の静止画です。機能の入口が存在する根拠で、完走やPB更新を示しません。
- 動作カットはI章のEXPLORE収録の再編集です。HUD時計はPNG保存・encoding待ち時間を含み、実RTA完走・PB更新・タイム短縮や実機性能の証拠には使いません。架空のタイマーやランキングを後付けしません。
- I章のこの収録はdash未習得。ジャンプをdashの実演とは説明しません。

9.8〜12秒は実TAメニューの静止画、26.2〜36.6秒はI章のジャンプと芯石の再編集です。全5章の景色紹介ではありません。全5章デモの存在は調査記録と現行資料に基づき、V章の保存画像とともに現在地として説明します。

## 公開案内の現在地

2026-10-25時点ではowner確認済みのCAMPFIRE公開前です。「応援してください」「フォローで、公開のお知らせを。」で統一し、支援URLは空欄です。正式な公開状態と公開URLを再確認し、公開済みとなった場合に動画・投稿文・一覧のCTAをそろえて更新します。未確認の募集開始、リンク先、目標額、リターン、提供日や完成保証は追加しません。SNSへの投稿・予約、CAMPFIREページの編集・公開、支援の送金は実施していません。

## 再制作

WSLのNode.jsと、既存WindowsのEffectCraft・FilmCraft・FFmpegを使います。このフォルダーで実行します。

```bash
node source/build-edit.mjs
node source/audio-v2.mjs
node source/produce.mjs prepare
node source/produce.mjs render
node source/verify.mjs
node source/make-index.mjs
node source/package.mjs
```

`build-edit.mjs` をやり直すには、同スクリプトが参照する元素材、captureとfocus記録、I章のPNG連番、実TAメニュー画像、3D映像、CAMPFIREメイン画像、GDScript原ファイルが必要です。音の再制作は `source/audio-v2.mjs` に記録した参照素材が必要です。旧 `audio.mjs` と旧mixは素材ベースとして保持し、出力にはV2専用mixを使います。

保存済みの `source/edit.json`、`source/episodes.mjs`、`media` 内のPNG連番・映像・画像とV2mixがそろっていれば、prepareから再出力できます。素材のフォルダー構成とPNG連番の名前を保ってください。納品先にはFilmCraft参照用のProResマスターも同梱します。大容量マスターはGitには含めず、必要ならprepare・renderから再生成します。

packageは別の納品フォルダーへコピー・再リンクし、その場所から原本を再読込・保存・描画して対応するSHAを記録する工程です。既定納品先は `F:/Videos/ProjectP-EMBERWAKE-RTA-V2-2026-10-25`。ネイティブcomp名は `EMBERWAKE RTA V2` です。旧60秒版・27秒版・過去の5本は別フォルダーに保持します。

## 素材と編集の入口

- [edit.json](source/edit.json) / [episodes.mjs](source/episodes.mjs)：18カットの時刻、文字、素材パス、注目位置、CAMPFIREの状態。
- [build-edit.mjs](source/build-edit.mjs)：元素材の入口。元プレイは v0.11.0、収録元commit `6233f5d33b24a35e91800357b7bcf8861049cf2a`。TA実装の調査commitとは区別します。
- `media/chapter-I`：本編で使う実ゲームの30fps PNG連番。未使用のII〜V章連番は本V2に含めず、元captureと旧V1に保持します。
- [time-attack-menu.png](media/time-attack-menu.png)：TIME ATTACK項目がある実タイトル画面。完走やPB更新の証拠ではありません。
- `media/dawn-still.png`：実ゲームV章の保存画像。`media/cinema-*.mp4`：Blenderによる開発イメージ。
- [real-code-excerpt.txt](source/real-code-excerpt.txt)：実GDScriptの抜粋。
- [CAMPFIREメイン画像](media/campfire-main.png)：制作済みの実画像。公開ページの収録ではありません。
- [audio-v2.mjs](source/audio-v2.mjs) / [V2mix](media/emberwake-rta-v2-mix.wav)：本版の音楽・編集演出音。FXを実ゲームSEとは説明しません。制作方法と音量等の検査は最終qaを参照します。
- [EffectCraft原本](projects/01-emberwake-rta-v2.ecproj) / [FilmCraft原本](projects/01-emberwake-rta-v2.fcproj)：編集プロジェクト。

## 素材の表記

- 元プレイ収録は開発中の v0.11.0。全5章デモが存在することと、製品版が完成・公開済みであることを区別します。
- 3DカットはBlenderによる開発イメージです。実ゲームは2Dで、そのプレイ画面や完成版の仕様として説明しません。
- CAMPFIREカットは制作済みの実メイン画像です。募集ページの公開画面の収録ではありません。
- GDScriptは実ファイルの抜粋を組版。エディタで入力・編集した実演ではありません。
- 音はaudio-v2.mjsとV2専用mixを使います。旧mixは素材ベースとして保持。FXは編集上の演出音で、実ゲームSEとは区別します。音量・境界等の検査は最終qaを参照します。

## 確認範囲

動画・原本・qaは制作の進行に合わせて生成されます。一覧と台本の生成だけで検査成功にはしません。形式・全デコード・音量・素材欠損・動画/mix/原本のSHAは最終の `qa/01-emberwake-rta-v2/technical.json` と各検査記録、納品先からの再読込・保存・描画とSHAは `qa/portable-package.json` を参照します。保存カメラ値・連続遷移フレーム・対象の実画像による追従確認も、最終qaで確認します。

この文書の生成作業では、直接の全編視聴・試聴、スマートフォン等の実機再生、ownerの創作採用、SNSへの投稿は実施・判定していません。実施した検査と残る確認を分けて報告します。

管理：Pui-core/- #89。一覧・README・台本は `node source/make-index.mjs` で再生成します。投稿文正本を変更した場合も再実行します。
