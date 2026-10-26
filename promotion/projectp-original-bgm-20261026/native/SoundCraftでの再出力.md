# SoundCraftでの再出力

実際に使ったDAWは **SoundCraft0.12.1**。AudioCreate/Cakewalkとは別のアプリです。Rootが選択した公式の無料DAWを専用Linux prefixへ展開し、headless CLIで本曲のMIDIをimport、内蔵音源を割当、mix/FXを設定、native `.scraft` 保存・再読込・bounceを実行しました。GUIやaudio deviceを使った操作ではありません。

## 同じ音を再出力する

公式releaseの `soundcraft-0.12.1-linux-x86_64.tar.gz` を取得し、同releaseのSHA256SUMSと照合します。本件archive SHAは `b0a56bd6b5d27de6b12e354580c362be6f59125ea58f573044c84f6a7da87780`。CLI binary SHAは `2d44b9a64c240170596bab9290d77af5cd3854406c6d3011881e58dcb6d516d5`。MITまたはApache-2.0、取得費用0です。通常のWindows/Sonar・global PATH・本人project・音声driver設定は変更していません。

```sh
export PROJECTP_SOUNDCRAFT=/専用prefix/bin/soundcraft-cli
export PROJECTP_SOUNDCRAFT_CONFIG=/本制作専用config
node source/render-soundcraft.mjs full
node source/render-soundcraft.mjs short
node source/check-native-audio.mjs
```

`PROJECTP_SOUNDCRAFT_CONFIG` は専用の一時/制作設定先です。QAの独立FFmpegは `PROJECTP_FFMPEG` で指定できます。今回の独立検査は既存Windows FFmpeg8.0.1をheadlessで呼び、設定やUIは変更していません。

`source/native-mix.json` が音色/FX/pan/faderの入力です。主旋律は短いsine/triangle系、和音は低いcutoff/遅いattack、低音は丸いsine系、打楽器はnativeのkick/snare/hat合成です。第三者sample/loop/factory demo song、外部VSTは使用しません。

全体は0〜82秒、短尺は別MIDIから0〜22秒。同じ曲の演奏区間に2秒の尾を付けます。音色をrender開始で初期化するため、全体の10〜30秒と短尺は同じ音符でも同一PCMではありません。音量や音質のA/B比較として使いません。

出力WAV/stemは `audio/`、原本は `native/connecting-lights.scraft` と `connecting-lights-short.scraft`。4stemの名前は各版の曲名＋元MIDI track名です。再現は音符/音色からのnative発音で、音声WAVを正規化して済ませる方法ではありません。

## 証拠の範囲

`qa/native-soundcraft/*-calls.json` は保存・再読込・loaded audio health・master/4stem出力の各終了コードを記録します。audio healthはloaded PCMの参照だけを調べ、MIDI発音/音量/FXの合格証ではありません。それらは最終WAVの全PCM検査、保存済native全音符/音色/FXとの対応、独立FFmpeg decode/音量で別に確認しました。

直接の全編試聴・ownerの音楽的採用・SNS投稿・Content ID登録は行っていません。音楽関係の動画を投稿しないというowner指示に従い、実ゲーム/アプリの背景制作素材としてのみ引き渡します。

一次資料：[公式repo](https://github.com/storytold/soundcraft)、[固定release](https://github.com/storytold/soundcraft/releases/tag/v0.12.1)、[v0.12.1 CLI](https://github.com/storytold/soundcraft/blob/v0.12.1/apps/soundcraft-cli/src/main.rs)、[制御protocol](https://github.com/storytold/soundcraft/blob/v0.12.1/docs/control-protocol.md)。README記載のpre-alphaという制約は保持し、本曲で実行できた範囲を製品全体の品質保証へ広げません。
