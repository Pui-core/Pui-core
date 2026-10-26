# EMBERWAKE 第2話の横動画・対応Short（制作納品）

[管理Issue117](https://github.com/Pui-core/-/issues/117) / 親[93](https://github.com/Pui-core/-/issues/93)・[106](https://github.com/Pui-core/-/issues/106)。一本の問いは「急な二段の近道、ダッシュで渡れる？」。実収録の両足場への着地から合流・結果を見せる3本と3Craft原本を完成した。公開・関連動画実設定・人気曲選定・成長目標の達成は別の未完事項。

Rootの[最終画像・F受入](https://github.com/Pui-core/-/issues/117#issuecomment-6412972385)は2026-10-26 18:45:36 JSTに合格。制作117は最新自己レビュー/必要checks/merge後に完了扱いにする。直接全編視聴/試聴・owner個人の創作採用・公開成果は別の未検証事項として保持する。

## 納品

`F:\Videos\ProjectP-Episode2-2026-10-27\revision-01\index.html` が再生一覧。`qa/delivery.json` SHA `e04b4277d78a882212676b4cbd93d3ff1c5b3199ca53bd63783fdae88b52e1ce`。対象2704files / 3768611916bytes、同一payloadの全SHA確認済み。

|用途|ファイル|尺/形式|最終SHA256|
|---|---|---|---|
|横動画|`videos/emberwake-episode2-futari-no-aizu.mp4`|82.005s / 1920×1080 / 30fps|`dc31b831b51192d659a57afe3a7c225dec19e27fce05a255de5b7f8df4d56a4a`|
|YouTube Short|`short/videos/episode2-short.mp4`|27.52s / 1080×1920 / 30fps|`cd818f84da5926eaf33caea0b4155e3e0fdc47c11484f8f90ba7e30789268db2`|
|TikTok follow候補・仮音源|`short/videos/episode2-short-tiktok.mp4`|27.52s / 1080×1920 / 30fps|`1735e42ee3200e709315d035f0d07c8a8ff4bb957408edd7781c93e5dcb9d3d2`|

補足のF自立性監査は `publication/native-dependencies-20261026/append-delivery.json` SHA `36fdd731ef700da95f5fb68b61b5339f0cd86951179cd017c8d2b1ca63d2207b`。base原票/メディアを変更しない別appendとして保存した。6 nativeの実絶対path参照を全てF117内/存在と照合し、私有tmp・旧112依存0。再制作sourceに書いた元製品・SDKの所在は編集原本の依存とは区別する。

## 事実と修正

- 固定0.12.0/source `71584a6bd0c8852885157de71032fd9252e7a04c`、正当な第1話saveから通常TAB/ENTER・物理・キー入力を自動化して第2話へ続行。製品の進行・座標・時計・callbackを直接変更していない。
- full05は1754f/30fps、A627 `(716.283,979.925)`、B669 `(801.400,931.925)`、island723、炉3/switch2/落下0、結果/手帳/タイトルまで。Bはy932で、通常route6のy924ではない。
- **PP117-FOOTING-001修正根拠**：driver `fc02714bf7d8b934aec4e2904f24f34a4ffc16dba6b8a7c791ecda98a4dbbed6` とcapture `14029377d2a5a81c8042a7e12c815c565676ac1a857ff50a6bb82d840071e261`、[Root受入](https://github.com/Pui-core/-/issues/117#issuecomment-6411697608)。最新自己レビューに解除根拠を記録する。
- 短縮した会話は引用符を外して「会話の要約」と明示。音声本文・時刻を変えず既438Coreを再利用。誤った人気曲選定済みflagもfalseへ訂正。
- 横冒頭は実dash601→721のlive映像＋小さな上部overlay、hostは4秒後。Short/TTもliveで開始し、冒頭hostを除いて字幕全文を保護。横4–7.6秒は実際の第2話選択後frame65へ訂正。
- Shortと本編は同じ問い。YouTubeは本編を見るCTA、関連実IDはnull/未設定。TikTokは別MP4で「このゲームの続きを、／フォローして見届けて。」。日本人気曲/CMLは未確認、108背景は仮音源でRoot採用・公開待ち。

## 検査範囲

- PhotoCraft cover2原本、EffectCraft/FilmCraft各3原本を**Fから再open/save/render**。EC欠損0、FC各3素材online、PC再保存後PNG同一。
- 3最終MP4の全AVdecode、H264/AAC48k/stereo/30fps/形式尺。横−19.2LUFS/−0.9dBTP、縦2本−19.1LUFS/−1.5dBTP。
- 横13句・縦各5句は全文句PCM assembly一致、最終AACの全句と語頭語尾の相関、最大lag0samples。数値検査を主観試聴と同一視しない。
- 実画面を横960f＋冒頭120f、縦各150fで比較。主要cut・A/B/合流の連続画像と最終字幕・coverを目視。Core口同期は30fps量子化（締め境界最大半frame）で、サンプル精度の口運動とは主張しない。
- **直接の全編実時間視聴・主観試聴は未実施**。Root最終画像レビュー前は117をcloseせず継続WTを保持。公開ID/関連設定/24h72h実績/フォロワー成果は未確定。

## 履歴と再配布範囲

Claudeがfull05実収録・VOICEVOX13・438Coreを制作し、Codexが既完了を再利用して最終3動画・3Craft/F納品・検査を担当した。途中CLIが通知待ち最終応答で終了した履歴を保持し、Codexは同じownedhandleを実完了まで追跡した。01落下、02別足場の判定停止、03誤受入、04途中終了を初回成功へ書き換えない。旧README/03reviewはqa/history、元原票と修正前映像は私有workspaceに保持。

Gitには制作コード・台本・native hash/私有F所在・検査要約とhashだけを保存。元MOC/atlas/SDK、独立音源、動画・生画像、rawsave/rawUI/authは再配布しない。Fにはnative編集に必要な描画済み素材を揃え、元モデル/SDKは含めない。共有WindowsGUI/browser/SNS/runtime/lease操作0。音楽主題投稿はSNS-003-NOMUSIC-001に従って禁止を維持する。
