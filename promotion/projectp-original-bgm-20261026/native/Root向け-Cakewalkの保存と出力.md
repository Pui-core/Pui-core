# Root向け：Cakewalkの実保存と出力

MIDI準備先：`F:\Videos\ProjectP-Original-BGM-2026-10-26\revision-01-source\midi\connecting-lights.mid`

Sonar実体：`C:\Program Files\Cakewalk\Sonar\Sonar.exe`。既存のowner原本や未保存編集を保持し、新しい本曲専用projectだけを操作します。画面操作はRoot一人、共有画面告知と最新UIを根拠に行ってください。以下は期待する操作/結果で、未実行です。

1. Sonarの通常File Openで上記 `.mid` を新しいprojectとして開きます。テンポ96BPM、4/4、4演奏track、32小節のデータとmarkerを確認します。MIDI trackに音符が見えるだけでは出音確認になりません。
2. 導入済softsynthを明示的に割り当てます。公式の通常経路はPlug-in Browserのinstrumentを対象MIDI trackへdragしてSimple Instrument化する方法です。実UIに合わなければInsert Soft SynthとMIDI Output割当を使用し、推測したcontrolを連打しません。

| MIDI track | channel | native instrument |
| --- | --- | --- |
| 01 Lantern motif | 1 | SI-Electric Piano、独立instance |
| 02 Soft chord bed | 2 | SI-Electric Piano、独立instance |
| 03 Rounded bass | 3 | SI-Bass Guitar |
| 04 Light pulse | 10 | SI-Drum Kit |

PCイベントは含めていません。General MIDIの番号で別のpresetへ変わることを避け、使ったnative音色を記録します。内蔵デモ曲/パターンは読み込まず、自作MIDIのノートだけを鳴らします。MS GS Wavetableなど外部MIDI出力はoffline audio exportの代わりになりません。

3. 対象4trackの出音メーター・output先と、主旋律/低音/打楽器が別に動くことを確認。音色・音量・panは実音に合わせて調整し、共通masterへrouteします。元MIDIのCC7/CC10は相対バランスの出発点です。
4. `native/connecting-lights.cwp` に通常Save As。可能ならこのproject内のaudio folderを使用し、別projectの音源を上書きしません。
5. 全体を0〜82秒（曲80秒＋tail2秒）として、48kHz/24bit/stereo WAVで `audio/connecting-lights-master.wav` へ通常Audio Export。実際の設定が異なる場合は記録し、拡張子だけで形式を決めません。native保存・WAV/stem出力後にFile Openで原本を再読込し、割当と欠損0を確認します。
6. 同じ時間範囲・gain条件で4つの演奏trackのstemを `audio/stems/lead.wav,keys.wav,bass.wav,drums.wav` へ出力します。Bus/master処理や共通FXがある場合は和とmasterの関係を記録。単体sample libraryの再配布ではなく、本曲の演奏stemです。
7. 短尺は別の `midi/connecting-lights-short.mid` から20秒＋tail2秒。次の章のノートを残響のために混入させず、対応native原本を別名保存します。最低でも全体の実DAW制作を先に完了し、短尺版が未出力なら未完了と記録します。

Rootから必要な返却：実native保存先・CWP/WAV/stem SHA、使用instrument/preset、routing/tempo/範囲/bitdepthの実画面またはnative記録、書出し結果、再読込結果、直接試聴の実施有無。privateな他project/認証情報の画面はsourceへ含めません。

## 導入済音源と追加VST

SI-Electric Piano、SI-Bass Guitar、SI-Drum Kit、SI-String Sectionは既存ディレクトリにあります。現編成で新しいVSTの不足は確定していません。ownerは必要な無料VST導入を許可していますが、本曲のために無関係な一式を増やしません。音源起動・認証・音色適合で必要性が判明した場合に、公式配布/商用条件を確認して最小限を選びます。

## 一次資料

- [Cakewalk公式：MIDI trackへinstrumentを割り当てる](https://help.cakewalk.com/hc/en-us/articles/360021665734-Recording-Using-a-MIDI-Track-or-Instrument-Track-in-Cakewalk-Sonar)
- [Cakewalk公式：softsynthのaudio出力](https://gaga.cakewalk.com/Documentation?help=SoftSynths.12.html&language=3&product=CakewalkSonar)
- [Cakewalk発行の旧EULA 2016、instrument content 4.2](https://store.steampowered.com//eula/606290_eula_0)：instrument contentを楽曲へ使う商用利用と、素材自体の再配布を区別。現Sonarの認証状態・個別追加音源条件をこの古い文書だけから保証しません。factory demo contentを本曲の入力には使いません。
