# MISSYOU 1.5 縦型動画 motion03（制作途中・公開 HOLD）

- 縦型 1080×1920、30 fps、13.205 秒。実 MP4 は Windows の `F:\Videos\ProjectP-Missyou15-Preview-2026-10-28\revision-03-motion\videos\missyou15-motion03-voice.mp4`。
- 出力 SHA-256: `899eecec6b3241528ccb95a0c95209929981617cc497ad1e4791a772aa671a3c`。
- 開発中の実機 QA 映像から、スタンプ候補の表示と選択前後を固定範囲で切り出した。26 フレーム全体を確認し、選択後のカードは同じ最終フレームの編集用切り抜き。送信成功や公開状況は主張しない。
- 日記は QA の静止画。名前を覆い「相手」と付記した編集画面であり、動画に「開発中の検証画面・一部匿名化」と表示。固定切り出し素材のみを編集に渡し、QA 個人情報は含めない。
- PhotoCraft の匿名化原本、EffectCraft の構成原本、FilmCraft の映像・声編集原本と依存素材は同じ `revision-03-motion` 内に保持。旧版は保持。3 原本をそれぞれ開き直し、FilmCraft の 4.9 秒を再描画した。出力全体デコードは成功、動画内音声は AAC 48 kHz 2ch。
- 1 秒間隔の出力シートとスタンプ区間 0.1 秒間隔シートを `qa/` に保持。対象のスタンプ切出し 26 フレームを目視した。音声の実聴、全編の連続再生、TikTok 側の楽曲選択と音はめは未実施。
- 語りのみで音楽未選択。日記は動作録画ではなく静止画のため、テンポと画面変化の要求をすべて満たすとは言えず、公開・予約・PR マージは HOLD。
- TikTok 商用向け楽曲の候補は日本の Commercial Music Library で地域と用途を確認して選択する。一般楽曲の商用権を推測しない。資料: https://ads.tiktok.com/resources/help/article/how-to-use-the-commercial-music-library / https://ads.us.tiktok.com/resources/help/article/commercial-music-library 。候補曲の個別利用可否・拍は未確認。
- 再実行は `PROJECTP136_ROOT` に `revision-03-motion` を指定し、`node source/photo-motion03.mjs`、`node source/picture-motion03.mjs`、`node source/render-motion03.mjs`。編集素材と原本に依存するため、実行先と既存ファイルを確認すること。再実行は該当出力を上書きする。
