# EMBERWAKE 制作秘話（管理146）

管理: https://github.com/Pui-core/-/issues/146

旧v07の攻略・解法紹介を差し戻し、操作の反応・原画と画角・手放す操作・入力案内の実制作記録を10分以上の横動画へ再制作する。元ゲームや旧版動画、他作業は変更しない。

## 現在の実状態

- 冒頭pilot01は実比較が成立したが条件列挙・語りと画の不一致で差戻し、履歴として保全。
- pilot02-r4は32秒のNative3Craft実原本とMP4。長押し誤読、画と声の時刻、声同士の重なりを修正。全AVdecode0、旧画像packetと同一、9句実PCM非無音頭尾非重複。Rootは冒頭pilot範囲の残3件を解除し本編制作を続行。全尺完成や公開承認ではない。
- J旧新6条件と中間短押し/期限切れの追加、Cの旧E競合→新Q→実歩行/E再取得/安全床/空中拒否、H9状態を専用Git archive copy/privateXvfbで実収録。固定条件・模擬入力を実機や通常プレイと呼ばない。
- 本編voiceは632秒に43句＋既存intro9句を配置。C10誤読とV06内部注意を該当WAVだけ修正し、全句の実非無音重複なし。正式Natural390frameとサムネ原本も完成・素材受領済み。
- Native本編J/V/C/Hは全尺を書出し、実画像で検出したJ09再跳躍の指標・箱の文字幅・重なり、Cの再生キーを部分修正中。既定TimeRemapキーが残るC9層と冒頭2層だけを2端点へ直して再読検証した。区間外映像はProRes圧縮packetを保持して接続する。
- 音の実WAVから後半のBGM無音を発見。枝単独は非零だが、初稿amixでglobal配置が崩れた段を限定probeで特定した。採用2曲の4章を独立local PCMとして作り、Nodeで632秒の正しいsample位置へ配置して修正。全52句で曲非零・声/曲差の最低14.049985dB、voice sample不変、PCMpeak−2.419925dBFS/clip0。初稿は履歴として保全し、現行再現はfull-audio-repair.mjs。
- 修正済みpicture6本と声/曲/SE3trackを正式FilmCraftへ保存・再読込し、18960frame/632秒を全編書出し中。最終AAC/全AV/実画像/NASと公開は未完了。

## 制作環境と保存

実素材/原本/QAは F:/Videos/ProjectP-EMBERWAKE-DevStory-2026-10-29/ に分離。Gitには再現用スクリプト、台詞/参照根拠、必要な非秘密記録のみを保存し、ゲームや人物素材・SDK/MOC・他者動画・私的UI/履歴は含めない。

Native3は公式同tag Linux releaseのdigestを照合し、CLI直接/privateXvfb/専用XDG/Wayland・DBUS未接続、CPU経路で保存/再読込/描画。Windows installed Craftは不使用。CLI実行・画像QA・主観試聴・創作採用・公開と効果を分ける。

## 編集方針

実差の先出し→条件/問題→実比較→短い図解→別条件での回収。指定channelや伸長参考から構成の働きを採り、他者の映像/台詞/音は転載しない。解法の順序、出口、COMPLETE、後半物語を伏せる。

本作は未完了。完成後は動画だけNASへ日時/作品/短い日本語内容・修正・版で保存し、SHAとNAS直接全AVdecode確認、原本依存のないlocalexportだけ整理する。現時点のNAS本編納品・投稿・売上/登録改善は未実施・未取得。
