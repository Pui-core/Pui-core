# 「嘘か誠か」短尺 v8：手掛かり先行・表示改善

14.506秒。v6、v7は保持。v7の冒頭の小さな文字を見直し、架空の手掛かり「寝る前は、映画だけ。」を大きく表示し、「嘘はどれ？」を加えた。続く5回答・正答・iPhone配信とApp Storeの検索案内は既存案を維持する。末尾は別の架空例を使った既存1.03 Simulator検証画面であり、配信IPAとのSHA一致は未確認。

- 実動画: `videos/truthorlie-vertical-v8-voice-only.mp4`、SHA256 `1f8383f2ed653851ed7e8858a2b52b28e84c1e1f90a44d1666620cd16a8698bb`。1080×1920、30fps、H.264/AAC、435フレーム。
- 実MP4の全AVデコード成功、4句のAACと原音の全体・語頭・語尾照合成功（最小相関0.999895、lag 0）。声のみで-19.8 LUFS、true peak -2.7 dBFS。数値検査を実際の試聴と扱わない。
- 最終MP4の冒頭2秒を8fpsで抽出、全秒と投票・正答・CTAの遷移を抽出。提示された文字・主要要素の重なりは見当たらない。F内のPhotoCraft、EffectCraft、FilmCraft原本を各アプリCLIで再読込。FilmCraftはFの原本から声入りMP4を出力、offlineMediaは空。
- 未確認: 音源選定・商用利用条件・拍、通し視聴と主観試聴、TikTok実機UI、投稿・予約、公開後の成長効果。v6・v7との優劣は仮説で未測定。Draft/HOLD。

[配信先](https://apps.apple.com/jp/app/id6783599249)。VOICEVOX:青山龍星。
