# 灯りがつながる：ProjectP用の自作BGM

**状態：作曲・MIDI準備済み、Cakewalkでの実保存と音源出力は未完了です。** 現在のMIDIには音声が入っていません。DAW制作完了・試聴済み・印税発生とは説明しません。

96BPM、4/4拍子、Dドリアンを軸にした32小節・80秒の独立したインスト曲です。小さな問いから始まり、10秒で旋律と軽いリズムがそろい、30秒で上の音域へ応答し、50秒で音数を減らし、60秒から解決へ戻ります。ゲームの仕掛けの発見や、アプリの変更前後を見せるための曲です。

- [全体MIDI](midi/connecting-lights.mid)：4演奏track＋テンポ/marker。96BPM/80秒。
- [短尺MIDI](midi/connecting-lights-short.mid)：同じ曲の5〜12小節、20秒。次の章のノートを含めず、別途2秒の残響用余白で出力します。
- [全音符と編曲](source/composition.json)、[音符一覧CSV](source/notes.csv)、[生成source](source/compose.mjs)。既存曲のMIDI・旋律・第三者loop/sampleは入力していません。
- [Cakewalkへの具体的引継ぎ](native/Root向け-Cakewalkの保存と出力.md)。音色割当・実出力・native原本の確認前はHOLDです。

既存のmedicateやCC BY曲は、この曲の元音源ではありません。AI支援で新しく音符と編曲を作成しました。商用動画への利用、独占Content ID、音楽著作権管理契約と分配、YPPは別に扱います。

管理：[Issue108](https://github.com/Pui-core/-/issues/108)、[YouTube親106](https://github.com/Pui-core/-/issues/106)。本source担当はGUI・既存Sonar原本・運用runtime・投稿を変更しません。
