# おさゆ配信のShorts編集

管理Issue: https://github.com/Pui-core/-/issues/148

配信の会話を話題ごとに短く編集し、通常のFFmpeg処理で字幕を焼き込む。元動画、同期音声、発話と単語時刻を含む編集指定、完成MP4は公開Gitに保存しない。NASへは動画だけを納品する。

## 制作

```bash
node score.mjs /absolute/output/original-bed.wav
node render.mjs /absolute/private-plan.json /absolute/output preview
node render.mjs /absolute/private-plan.json /absolute/output render
```

`FFMPEG`、`FFPROBE`で実行ファイルを指定できる。既定は既存Windows版をWSLから使用する。`CLIP=<id>`で1本だけ処理する。編集とレンダーの作業領域はLinux側に置く。

非公開の指定JSONは次の構造。`sourceVideo`と`alignedAudio`は既存ファイルの絶対パス。各cutのstart/endとcaptionのstart/endは元MP4のコンテナ秒で統一する。`filename`は`_音声のみ.mp4`で終える。

```json
{
  "sourceVideo": "/private/source.mp4",
  "alignedAudio": "/private/container-aligned.wav",
  "bgm": "/private/original-bed.wav",
  "clips": [{
    "id": "example",
    "title": "見出し",
    "filename": "example_音声のみ.mp4",
    "cuts": [{
      "start": 10,
      "end": 13,
      "speed": 1.2,
      "captions": [{"start": 10.1, "end": 12.8, "text": "字幕", "emphasis": true}]
    }]
  }]
}
```

- 無言や重複を詰めながら、相手の発言と返しの順序、語頭・語尾・反応の余韻を残す。
- 全区間1.15〜1.25倍。音声は`rubberband`の`tempo`だけを変え、`pitch=1`、`formant=preserved`を明示する。
- 元の縦映像の全体を保持し、1080×1920・30fpsへ通常リサイズする。人物画像のAI解析、再生成、AI背景除去はしない。
- 字幕は短い句ごとに切り替え、白文字と黒縁、会話の色分け、短い拡大着地を使う。話者を確定できない箇所に名前を付けない。
- `preview`分岐は映像を読み込まず、予約矩形と字幕だけを描画する。本番と同じ字幕ファイルを生成する。
- 元アーカイブの音声は先頭遅れと途中PTSギャップを持つ。既存のコンテナ時刻へ同期済みWAVを使用し、先頭遅れを再加算しない。
- 音量はカットごとに変えず、全カット結合後に2パスで調整する。音声のみ版は追加BGMなしで、元配信の音は保持する。
- BGM版は自作の軽いインストを約-30 LUFSで追加。既存TikTok楽曲や試聴音源は混ぜない。映像は音声のみ版からコピーする。
- キャッシュは素材パス・区間・速度・フレーム数の署名を使う。元ファイルを同じパスで更新した場合はpartと署名を削除して再制作する。

## 参考にした公開例

- [ぶいぬきっ！のShorts](https://www.youtube.com/shorts/CzDepq5wAic)：一つの突発的な行動と反応を扱う短尺。[公開サムネイル](https://i.ytimg.com/vi/CzDepq5wAic/hqdefault.jpg)の大きな白文字・太い黒縁・2行配置を実見した。
- [ホロクリップのShorts](https://www.youtube.com/shorts/aYEIn9EVW78)：[公開サムネイル](https://i.ytimg.com/vi/aYEIn9EVW78/hqdefault.jpg)の短い見出しと上部余白を実見した。
- [TikTokの切り抜きアカウント](https://www.tiktok.com/@hiroyukisansen)も調査したが、本体へアクセスできず、字幕様式を実見したとは扱わない。

動画本体の取得制限があり、参考動画の字幕タイミング・カット間隔・速度を実測したものではない。今回の速度はownerの指定、字幕切替は今回の発話時刻から設計した。

## 検品

構文、差分、各cutと字幕の時刻、文字幅、人物未読込プレビュー、最終MP4のメタデータ・全編デコード・音量、最終AACの音声認識、同じ発話のピッチ、NASコピーのSHA-256を確認する。音声認識・数値検査と人間の全編試聴・映像確認を区別する。技術検査だけをownerの創作承認や投稿効果の証明にしない。

### 2026-10-29の検査結果

- 4本の映像尺は23.733 / 24.967 / 9.100 / 33.867秒、計42カット。各BGM版と配信音声のみ版を制作。
- 最終8本の全編デコード成功。BGM有無の各ペアで映像のビットストリームが一致。音声版4本の最終AACを再認識し、掛け合いと主要発言を確認した。
- 同じ発話位置を対応させたF0比の中央値は各動画でおおむね1.000。1.15〜1.25倍の速度に比例するピッチ上昇は検出されなかった。数値検査であり人間の聴感評価とは区別する。
- BGM版は約-16.62〜-15.96 LUFS、真ピーク-3.54〜-1.79 dBTP。自作BGMを約-30 LUFSで追加した。
- ASRの単語時刻を実際の音量と照合し、約1秒の不要な無音を見つけて修正。修正後の当該動画で最長の低音量区間は約0.47秒。
- 元動画と同期WAVのSHA-256が既存の同期検証記録と一致。人物入り映像のAI表示・解析は行っていない。人間による全編試聴とTikTok実機の表示確認は未実施。
