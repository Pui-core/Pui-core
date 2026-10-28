# 「嘘か誠か」縦短尺 v6（声入り・音楽未選定）

架空の2人対戦のクイズを通して配信アプリを紹介する14.506秒の確認版。v5は保持し、v6では11秒以降にアプリの検証画面、別の架空例である旨、iPhone配信とApp Store検索名を配置した。

## 配信と画像の出典

- 日本のApple公式Lookup API `https://itunes.apple.com/lookup?id=6783599249&country=jp` の2026-10-28 10:34 JST取得結果は、公開版1.03、2026-10-26 20:41 UTC更新。説明文と公開画像は「5つの回答に1つ嘘」と記述し、動画の問いと一致する。`qa/appstore-lookup.json` に取得日時・本文・画像URLを記録。公開IPAの現物SHAと検証用アプリのbinary SHAが同一かは未確認。
- 最後の画像は既存 #121 の1.03(23) Simulator検証で保存された XCTest 画面添付のうち、既存 #129 が無加工で複写した1178×2556のもの。`media/app-103-simulator-example.png` は元添付のSHA `0c46991f73c2b40b79e64292a740f04f3698ae8b7bc689769f30030ee2947f80` と一致。動画中で縮小し「別の架空例・1.03検証画面」と記している。今回Simulatorの起動・操作は行っていない。
- [日本のApp Store](https://apps.apple.com/jp/app/id6783599249)。YouTubeチャンネルに配布リンクを設定済み。TikTok本文URLのタップ可否は未確認。

## 原本と確認

- `videos/truthorlie-vertical-v6-voice-only.mp4` SHA256 `02037de58ece8f65f0ef14be9e1455dde2e83a858516ab85da1cf7506f6d99d4`。1080×1920／30fps、14.506秒、H.264・AAC。VOICEVOX:青山龍星。
- FのEffectCraft原本から映像をレンダーし、FのFilmCraft原本で音声と合成。PhotoCraftのカード原本、EffectCraft原本、FilmCraft原本をそれぞれFから再読込。PhotoCraft素材はv5から保持。最終MP4の全AVデコード、音声4句の最終AAC全体と語頭・語尾の照合、全秒画像と主要切替の連続画像を確認。最終AACは -19.8 LUFS／true peak -2.7 dBFS。これらは直接視聴・試聴とは異なる。
- 比較用 `media/picture-v6-local-draft.mov` とF原本からの最終 `media/picture-v6.mov` は両方保持。両方とも中間素材としてGitには入れない。
- 未確認：最終動画の通し視聴・試聴、TikTokの実機UIとの重なり、声と音楽のバランス、音源の日本向け商用利用条件・拍合わせ、配信IPA binaryの照合、公開後の視聴・フォロー。予約・投稿なし。Draft/HOLD。
