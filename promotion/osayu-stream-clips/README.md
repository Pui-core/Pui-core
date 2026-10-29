# おさゆ配信Shorts：話者ごとの左右字幕と書体


管理: [字幕の再修正Issue153](https://github.com/Pui-core/-/issues/153)。v2は顔を避ける構造だけでは字幕品質を満たせず、ownerから再差し戻し。v3は指定2チャンネルと追加4チャンネルの実公開フレームを比較し、書体・多層の縁・短句・話者の左右を作り直した。元映像の人物位置をAIで確認したとは扱わない。

## v3の字幕制作

検証済みv2の字幕前run映像と、各BGM版の完成AACを使う。映像だけを再描画し、音声は各版からstream copyする。音声の取り直し・速度変更・再エンコードは行わない。

```bash
node restyle.mjs /absolute/private-v3-plan.json /absolute/revision-02 /absolute/revision-03/render preview
node restyle.mjs /absolute/private-v3-plan.json /absolute/revision-02 /absolute/revision-03/render render
node caption-regression.mjs
node regression.mjs
```

private計画には、v2計画のJSON SHA256をbasePlanSha、書体ごとのfamily/path/sha256をfonts、各clipのspeakersを明示する。各字幕はspeakerを必須とし、fontTreatmentとemphasisで書体を選ぶ。元のspeaker引数が戻り値から落ちていた欠陥を繰り返さず、色から話者を推測しない。切り出し区間・速度がv2と違えば、描画前に拒否する。

- おさゆは左、凸者は右の編集上の固定レーン。色と小さな話者名も固定し、同じ人の連続発話は同じ側へ置く。これは元映像での人物の左右位置を実見した結果ではない。
- 主字幕は左端76/右端1004、中心y284。名前はy126。2行までの短い句を大きく置き、太い白内縁・話者色の外縁・黒外周を重ねる。字幕帯や英字ブランドは使わない。
- 通常会話はKeifont、数字・強い短句はDela Gothic One。ためらう返答や弱い声量の感謝は851チカラヨワク、強い抗議や強まる反復だけ851チカラヅヨクを使う。静的に不揃いな字形であり、声の震えを検出したとは言わない。今回の最終版は全文の振動アニメーションを付けない。
- Delaは字面が低いため、同じ字号を機械的に使わない。1行/2行の縦倍率を分け、実libass描画の輪郭で収まりを確認する。
- 名前と2行本文が接触した初稿を修正。人物を含まない黒地の実描画から、本文の境界・名前との画素重複・映像領域への侵入を検査する。
- 謝罪中に相手の反応字幕が出続ける箇所を、謝罪2句→反応へ分割。文脈と音声の相対比較を根拠とし、短い重複発話の話者や音素境界まで確定した扱いにはしない。
- previewは映像をimportせず、矩形だけを描く。本番とpreviewのASS/plan/renderer SHAを記録し、旧previewを最終確認へ流用しない。フォントの出力先コピーもSHAを確認する。

### v3最終出力の確認

- 58字幕は通常40・強調11・柔らかい手書き5・強い手書き2。全話者レーンの不一致0、文字だけの確定プレビューを別担当も確認。
- 本文の実輪郭下端は最大403px、映像開始432px。名前との実描画重複0。最終映像の全2,759フレームで字幕の元映像領域への描画差0。
- 8本の全8,634 AAC packetsについて、データ・PTS/DTS・duration・skip_samples等とcodec/extradataがv2と一致。全5,518映像フレームの枚数・先頭0・30fpsのPTS、全8本の厳格AVdecodeを確認。
- 完成receipt・検査前後・NASコピーのSHAを照合。元の音声を変更していないことの検証であり、声の人物同定や人間の聴感の確定とは区別する。


## 書体の導入と出典

ownerの導入許可に基づきLinuxのユーザーフォントへ取得・導入し、Windows FFmpegはfontsdirで同じ実ファイルを読む。公開Gitへフォント本体は同梱せず、作者の配布元と規約を制作記録へ保存する。

| 書体 | 一次資料 | 今回の用途 |
| --- | --- | --- |
| Keifont | [すもももじ公式](https://font.sumomo.ne.jp/font_1.html)・Apache 2.0 | 通常の会話と話者名 |
| Dela Gothic One | [Google Fonts公式/OFL](https://github.com/google/fonts/tree/main/ofl/delagothicone) | 数字、短い強調、見出し |
| 851チカラヨワク / チカラヅヨク | [作者公式規約](https://pm85122.onamae.jp/851fontTerm.html) | 声の調子に合わせる手書き風 |

指定例の正確なフォント名を同定したわけではない。スクリーンショットは不揃いな手書き字形の参考であり、アニメーションの証拠とはしない。

## 追加の参照と検証範囲

- [けんき指定チャンネルの例](https://www.youtube.com/shorts/aSLKpETTiQQ)：黒い上下、極太の装飾文字、黒と白の縁。
- [V好きの一般人の例](https://www.youtube.com/shorts/bGstdRSAJMQ)：話者色の塗り、太い白内縁、色/黒外縁、短い1〜2行。
- [V切り抜き日記](https://www.youtube.com/shorts/x7C5q9lClQc)、[ぶいすぽ博物館](https://www.youtube.com/shorts/zhO8D6JUmXs)、[ンデ](https://www.youtube.com/shorts/BuBiYTDScKc)：肉厚な書体、人物色と多層縁、短い句の切替を比較。
- [にじさんじ愛好家](https://www.youtube.com/shorts/RZviroOj900)：黒余白は参考。字幕が小さいため主基準にはしない。

公式storyboardは1秒間隔、公開縦画像は字体の補助として実見。元フォント名・細かなイージング・音声同期・再生数との因果は未同定。原動画・音源・画像は制作物へ流用していない。左右固定は今回のowner仕様であり、参考全chが左右振りをしているという報告ではない。

数値検査とキャラ未読込の目視、実音声出力、ownerの創作採用、投稿後の効果は分ける。v3の音声はv2との全AAC packet/timestamp/extradata比較で確認し、元声の自然さの再評価には置き換えない。

---

管理: [修正Issue150](https://github.com/Pui-core/-/issues/150)、[旧制作Issue148](https://github.com/Pui-core/-/issues/148)。元動画・音声・発話全文・完成MP4は公開Gitへ入れず、NASへは動画だけを保存する。

## v1の差し戻しと再発原因

v1はownerから「音がぶちぶち」「字幕が顔にかぶる」と差し戻された。ASR・F0・デコード・コピー照合は成功していたが、音声品質と顔回避を確認できる検査ではなかった。

完成声へ使った同期研究WAVには、旧42cutの109.14秒中に843箇所・計6.924秒の人工的な微小無音があった。同じ42区間を元MP4から直接連続decodeしたPCMでは、同じ閾値の内部穴は0だった。既存の`gara-bingo/archive-jet-v4/pipeline.mjs`は既に`padded alignedAudio is forbidden`としており、このベスト手順を取りこぼして再発させた。

同期WAVのハッシュ一致や音声認識成功を、自然な音声の証明に使わない。本番音声へ同期WAVを戻さないことを実行時の入力検証にもした。元時刻が連続する同速の句は一度にdecodeし、内部で音声処理を再起動しない。

## 制作

```bash
node score.mjs /absolute/original-bed.wav
node render.mjs /absolute/private-plan.json /absolute/output render
node render.mjs /absolute/private-plan.json /absolute/output preview
node regression.mjs
```

`FFMPEG`・`FFPROBE`で実行ファイルを指定できる。既定は既存Windows FFmpegをWSLから呼ぶ。`CLIP=<id>`で1本を選べる。ソース編集・制作はLinux側の専用worktreeで行う。

```json
{
  "audioCutMode": "direct-container-seek-continuous-samples",
  "sourceVideo": "/private/source.mp4",
  "bgm": "/private/original-bed.wav",
  "clips": [{
    "id": "example",
    "title": "短い見出し",
    "filename": "example_v2_音声のみ.mp4",
    "cuts": [{
      "start": 10,
      "end": 13,
      "speed": 1.2,
      "captions": [{"start": 10.1, "end": 12.8, "text": "発話字幕"}]
    }]
  }]
}
```

時刻は元MP4コンテナの秒。`alignedAudio`のある旧指定は描画前に拒否する。同期WAVはASR探索用であり、完成声の入力にはできない。
`regression.mjs`は正しい音声モードへ不良のWAV指定を添え、別の入力不備に隠れず拒否されることを確かめる。メディアや外部ソフトなしで実行できる。

- 元MP4の各区間を直接seekし、`asetpts=N/SR/TB,aresample=48000:async=0,atempo=<速度>`で連続PCM化する。許容速度は1.15〜1.25倍。今回の修正版は全編1.20倍。
- 連続する同速区間はまとめて処理し、句端ごとに音をミュートしない。別の発話へ飛ぶ切れ目だけ15ms/20msの端フェードを使う。
- 実PCM長以上の動画フレーム数を選び、声を途中で切り捨てない。音声末尾のフレーム端補完は最大55ms未満に制限し、長い無音を埋め戻さない。
- 完成声はサンプル単位で一つのPCMへ結合する。映像用MKVの時刻から音声の結合位置を推測しない。
- 音量は全編の測定から一つの固定倍率を適用。句ごとの音量変更やAGCを加えない。BGMは自作インストを小さく加え、BGMなし版も配信音声を残す。

## 字幕と顔の領域分離

出力1080×1920。元映像の全体を810×1440へ等倍比で縮小し、(134,432)へ配置する。上部432pxは純黒で、短い見出しを(540,70)、会話字幕を(540,264)へ置く。人物の顔をAIで調べず、元映像全体を字幕領域から分離するので顔位置に依存しない。

字幕は太字・白/青/黄・黒縁、2行まで。字幕裏の帯、半透明の横帯、ミントの線、英字ブランド表示、下部のハンドル帯は描かない。画面全体の黒い余白と、映像へかぶせる字幕裏の帯を区別する。

`preview`は元映像を読み込まず予約矩形だけを描く。実出力後は同じplan/rendererハッシュの確定済み字幕と尺を再利用し、描画用の仮尺で本番の音声証拠を上書きしない。

## 実見した参考

- [ホロクリップ「油断」](https://www.youtube.com/shorts/aYEIn9EVW78)：公式動画の1秒間隔storyboardを実見。上部約22%の純黒、黄色い短見出し、白/青と太い黒縁、顔のない空きへ置く会話字幕、独立した字幕帯なし。
- [ぶいぬきっ！ APT](https://www.youtube.com/shorts/CzDepq5wAic)：公式storyboardを実見。極太の白文字と黒縁、2行まで、短い句ごとの切替、字幕用の帯なし。

今回の顔回避は、参考の「空いている領域へ置く」設計を上部の黒余白へ適用した。参考チャンネルの人物配置や画面をそのまま流用しない。1秒間隔のフレームから、正確な字幕滞在時間・音声品質・ジェットカット間隔を実測済みとは扱わない。

## 検証方針

既知の不良WAVを負例にし、穴を検出できることを確かめる。本番は元MP4からの独立した連続抽出と照合し、PCMの内部穴、句端、最終AACのエンベロープと欠落を確認する。ASR・F0は補助とする。

全編デコード、実プレイヤーの再生経路、音量、字幕の元映像領域との非重複、不要な帯・ラベルの不在、BGM有無の映像一致、NAS側の存在とSHAを確認する。自動検査、再生API、本人の聴感、ownerの創作採用は別の結果として記録し、確認できないものをPASSへしない。キャラ入り映像をAIの画像解析やビューアへ渡さない。

### 2026-10-29 修正版の実測

- 4本は23.933 / 25.433 / 8.967 / 33.633秒。旧42の句を連続性で27区間へ統合し、切れ目以外で音声処理を再起動しない構成にした。
- 27区間すべてのraw PCMが、元MP4から独立に取り直した基準と完全一致。全編のPCMは宣言した端フェードと最大42.17msの末尾補完以外に変化なし。
- 最終AACと基準音声のエンベロープ相関は0.999981〜0.999999、lag0ms。6ms以上の新たな深い欠落は検出なし。元基準にもある低振幅領域は新規欠落と混同せず、「すべての無音が0」とはしていない。
- 旧843穴の不良WAVと、意図して30msの穴を入れた不良音声を負例にして、検査で拒否されることを確認した。ASRでも主要な掛け合いが残ることを再確認した。
- 全2,759フレームで字幕描画による元映像矩形の画素差0。人物画像をAIへ見せず、字幕と元映像の非重複を実際のlibass描画で確認した。
- BGM有無の各ペアは映像ビットストリーム一致。最終8本の全編デコード成功。自動検査・再生経路の動作と人間の聴感評価は分けて記録する。
- NASのMP4/AACは実プレイヤーから読めたが、Windowsの音声出力endpointがなくWASAPI/DirectSound/WinMMとも音声デバイスを開けなかった。exit code 0を成功と扱わず、実音声出力の完走と人間の聴感は未検証とした。dummyへの置換、OS設定変更、利用者の操作を奪う処理はしていない。元MP4と最終AACの信号比較・デコードの成功とは別の結果として保持する。
