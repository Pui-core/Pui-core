# 灯りがつながる：ProjectP用の自作BGM

**状態：SoundCraft 0.12.1の実native制作・保存/再読込・音源出力・数値検品を完了。** 実ゲームとアプリ動画の背景音に使う制作素材です。2026-10-26のowner訂正に従い、音楽制作・MIX・MV・単体BGMの動画は投稿しません。自動的な印税発生・Content ID登録・YPP達成は含みません。直接の全編試聴は未実施です。

音声はFの制作納品に保持しています：`F:\Videos\ProjectP-Original-BGM-2026-10-26\revision-03-native-soundcraft\audio\connecting-lights-master.wav`（82秒）と同フォルダーの `connecting-lights-short-master.wav`（22秒）。Gitには独立作曲source/MIDI/native編集原本/QAを保存し、単体音源の配信は追加しません。

96BPM、4/4拍子、Dドリアンを軸にした32小節・80秒の独立したインスト曲です。小さな問いから始まり、10秒で旋律と軽いリズムがそろい、30秒で上の音域へ応答し、50秒で音数を減らし、60秒から解決へ戻ります。ゲームの仕掛けの発見や、アプリの変更前後を見せるための曲です。

- [全体MIDI](midi/connecting-lights.mid)：4演奏track＋テンポ/marker。96BPM/80秒。
- [短尺MIDI](midi/connecting-lights-short.mid)：同じ曲の5〜12小節、20秒。次の章のノートを含めず、別途2秒の残響用余白で出力します。
- [全音符と編曲](source/composition.json)、[音符一覧CSV](source/notes.csv)、[生成source](source/compose.mjs)。既存曲のMIDI・旋律・第三者loop/sampleは入力していません。
- [実際に使ったSoundCraftと再出力](native/SoundCraftでの再出力.md)、[背景音としての使い方](使い方-%230108ゲームとアプリの背景音.md)。

実音源はSoundCraft内蔵のSubtractive Synth（主旋律/和音/低音で異なる設定）とDrum Synth、Room Reverb、DC Offset Removalを使いました。Cakewalkの無料利用画面を経た実保存・出力は成立していないため、Cakewalk/AudioCreateで作ったとは説明しません。[Cakewalk向けの当初手順](native/Root向け-Cakewalkの保存と出力.md)は未実行の履歴です。

## 検品と原本

- [最終音声・native対応検査](qa/native-audio-final.json)：全630音/短尺186音が保存済native原本と一致、96BPM、48kHz/24bit/stereo、4つの別発音trackとFX/pan/faderが設定値と一致。外部音源参照0。
- 独立FFmpeg全decode/EBU R128：全体 **-17.4 LUFS / -3.0 dBTP**、短尺 **-17.1 LUFS / -1.6 dBTP**。clip0、最終200msはPCM0、DCはnative5Hz除去で解消。
- 各版4stemは同じ時間範囲・mix条件。和とmasterの最大差は24bitの6LSBで、native stem側ditherによる微小差です。bit一致とは説明しません。
- 編集原本：[全体](native/connecting-lights.scraft)・[短尺](native/connecting-lights-short.scraft)。MIDIと音色/FXを保持し、native CLIで保存・再読込してからbounceしました。
- `qa/source-ready.json`、`qa/midi-integrity.json`、`qa/source-delivery.json`、`source/composition.json`内のnative欄は作曲/MIDI準備時点の履歴です。現在の出音/納品状態は最終QAと `qa/delivery.json` を正とします。

既存のmedicateやCC BY曲は、この曲の元音源ではありません。AI支援で新しく音符と編曲を作成しました。商用動画への利用、独占Content ID、音楽著作権管理契約と分配、YPPは別に扱います。

管理：[Issue108](https://github.com/Pui-core/-/issues/108)、[YouTube親106](https://github.com/Pui-core/-/issues/106)。本担当はGUI・既存Sonar原本・運用runtime・SNS投稿を変更していません。
