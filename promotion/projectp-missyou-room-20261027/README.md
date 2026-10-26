# ProjectP missyou『飾った日記は、アプリを閉じても残る？』実操作Short (#118)

missyou（開発中）のお部屋で、スタンプ日記を**額**と**折り紙の花**に飾り、アプリ終了→**resetなし再起動**後も同じ日記が残ることを、実機（headless Simulator）のオフライン検証で収録した縦型Short。

- **開発中・オフライン検証データ**（TestFlight配布/本番通信/APNs未証明。network=0 / submitted=1 の端末内QA）。実際の受信・配信実績ではない。
- 納品: `F:\Videos\ProjectP-Missyou-Room-2026-10-27\revision-01`（動画/cover/native/素材/metadata/QA/receipt）。
- 管理Issue: Pui-core/-#118。Root最終映像レビュー前はcloseしない。

## 成果物
- `media/missyou118-short.mp4` — YouTube Short版（primary, 1080x1920 30fps, -14.4 LUFS）
- `media/missyou118-short-tt.mp4` — TikTok followCTA版
- `projects/missyou118-visual.ecproj` / `-tt` — EffectCraft編集原本（字幕/寄り/モーションブラー/CTA）
- `projects/missyou118-final.fcproj` / `-tt` — FilmCraft編集原本（映像＋ナレーション＋自作BGM mix）
- `covers/cover.png` — カバー

## パイプライン（再制作）
前提: Mac SSH `puis-mac` / VOICEVOX 0.25.1(:50031) / Windows PhotoCraft・EffectCraft・FilmCraft・FFmpeg / Node.js。

1. 実素材収録（済・原本private保持）: `source/mac-pilot.sh`（pilot）→ `source/mac-record.sh`（testA連続収録, HUP/TERM/EXITでも自recorderだけSIGINT finalizeするtrap入り）。`normal-taps.mov` を private root へ byte一致で取得。
2. ナレーション: `node source/voice.mjs`（VOICEVOX speaker13 青山龍星→`media/voice-01..07.wav`, `qa/narration.json`）。
3. 正規化＋裁断: FFmpegで CFR 1080x1920 30fps 化（VFRのseek不整合回避）→ `media/segments/seg1..7.mp4`。
4. ビジュアル: `effectcraft-cli script source/build-visual.jsx` → `render` → `media/visual-master.mp4`。
5. 組み: FilmCraft JSONL（`/tmp/fcbuild.jsonl` 相当）で V1=visual / A2=narration / A3=自作BGM bed(ducked) → `file.exportMedia` h264/AAC。
6. 検品: `qa/technical.json`（全decode/尺/LUFS/TP/音量バランス/フレーム目視/offlineMedia=0）。

## 使用素材・権利
- ナレーション: VOICEVOX：青山龍星（クレジット必須）。
- BGM: ProjectP自作『灯りがつながる / connecting-lights』（PR32 merged、実ゲーム・アプリ動画の背景素材として承認範囲）。外部sample/loop/VST 0。TikTok版の人気曲採用はRoot未選定（仮音源）。
- 字幕/タイトル: 教科書体(UD Digi Kyokasho NP)。筆/brush書体は環境に無いため使用せず（筆文字とは称さない）。

## 既知の未完了
- Live2Dアバター（Revenant_Natural）の口パク/表情オーバーレイは未同梱 → `qa/avatar-status.md`（Cubism Core Java SDK=CUBISM_CORE_DIR 未提供のため。VTS共有GUIは範囲外）。
- 動画全編の実時間 直接視聴/試聴は未実施（数値検査＋抽出フレーム目視のみ）。
