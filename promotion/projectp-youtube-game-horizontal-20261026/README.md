# EMBERWAKE 本編1話の横動画

実装管理: [Issue112](https://github.com/Pui-core/-/issues/112)。本編0.12.0の固定source `71584a6bd0c8852885157de71032fd9252e7a04c` を収録し、実際の1話の結果から構成を決める。音楽主題動画は作らず、108の独自BGMはゲーム紹介の背景素材として使う。

## 収録の入口と保存領域

- `/home/pui/tmp/projectp112-capture-20261026/product` は、GitHubの固定commit archiveを展開した専用コピー。ゲームのcore72ファイルは読取専用、`qa/product-source-before.json` のSHAと照合する。
- Godot4.6.3とLinux専用Xvfbを使う。Windowsのゲーム、共有デスクトップ、ownerの保存データ、稼働editorは操作しない。
- `source/run-capture.mjs` は試行ごとに未使用の出力・XDG data/config/cache prefixを指定する。`source/capture.gd` が実際の `OS.get_user_data_dir()` と `user://` の保存先をmain scene読込前に照合する。prefix外・既存save/bak有りなら読込前に失敗する。
- 初回pilot原本は `source/capture-pilot.gd`。タイトルの「物語を進める」から会話3頁と「出発」を実Focus+Enterで進め、300枚/10秒を収録した。Rootが2026-10-26 04:48:32 UTCに主要5画像と原票を確認し、限定範囲のPASSを返した。`qa/pilot01-capture.json` と `qa/pilot01-binding.json` を参照。
- 同じ通常入口からfull01を1回収録し、3つの炉・結果・手帳2頁・タイトルへの帰還まで1868枚/62.2667秒を記録した。169入力event、落下0、結果は第1話完了・失った記憶1/15。core72ファイルのSHAは不変。Rootのpilot確認はownerの創作採用や全編視聴/試聴を意味しない。
- full driverは、プレイヤー位置・足場・進行を読み取り、通常の方向キー/Space/Eとゲームのphysicsで進む。ゲームの開始関数・会話終了関数を呼ばず、座標・進行・時計を書き換えない。失敗試行は残す。

実行例（Rootのpilot目視後のみfull）:

```sh
node source/run-capture.mjs full full01
```

同名試行は再利用しない。native側の壁時計上限はpilot90秒/full720秒、枚数上限は420/5000。出力は実PNGと入力/観測原票。PNG保存待ちがゲーム内の壁時計HUDに含まれるため、RTA/PB・人間の初見プレイの証明ではない。ゲーム音はDummyで収録していない。追加BGM/VOICEVOXをゲームの実収録音と呼ばない。

## 制作と納品の境界

PhotoCraft・EffectCraft・FilmCraftの実CLIでnative原本を作る。既存モデルRevenant_Naturalと、必要なナレーション・108の独自BGMを使用する。coreゲームの改修、架空の会話/結末、過去48秒PVを伸ばす編集は行わない。

F納品先は `F:\Videos\ProjectP-YouTube-Game-Horizontal-2026-10-26\revision-01`。素材を揃えたnative原本の再読込/保存/描画、欠損0、最終動画の全decode・音量/ピーク・同期・重要画面・SHAを確認する。数値検査・画像抽出の目視・実時間の全編視聴/試聴は別の記録にする。

YouTubeの本人channel確認と実公開はRootが担当する。sourceの完了・PRのマージだけで投稿済みとは扱わない。111の旧0.11の芯石Shortと、この本編の約束/忘却を同じ問いへの回答だと自動的に説明しない。

## 今回の82秒

冒頭は実環境805と結果の一行1160のPhotoCraft crop。出発前の会話は各4秒を取り、19.6〜50秒で収録200〜1111の912枚を途切れず1倍再生する。3つ目の炉と結果への移行は自作BGM108の50秒のセクション切替へつながる。その後、実結果の可読な3行・記憶数0→1の実画面比較・手帳2頁を見せる。失ったものは実UIにある「公園でルミと走り回った午後」。ルミの名前を覚えている実台詞と区別した。

手帳1頁の長文は製品側で右にはみ出すため、原票と検査画像を残し、完成動画に採用しない。本Issueでゲーム本体を改修していない。忘却を落下や再挑戦の罰と説明せず、15話全体をクリアした映像とも扱わない。

新VOICEVOX13句と自作BGMは、別々の48kHz/24bit/stereo stemとしてFilmCraftのA1/A2へ配置する。Naturalは今回の声だけの包絡から438枚を既設公式Cubism Coreで描画。0〜7.6秒と75〜82秒だけに配置し、ゲームの操作と重要な会話を隠さない。原モデル/Core/SDKはGitや納品へ同梱せず、元ファイルSHA不変と全438枚の頭部余白を検査する。ソフトウェアの三角形描画であり、カメラ追跡やVTS物理の収録ではない。

制作recipeは `prepare-media.mjs` → `voice.mjs` → `model.mjs` / `audio.mjs` → `ui-crops.mjs` / `cover.mjs` → `picture.mjs` → `render.mjs` → `verify.mjs` → `deliver.mjs`。既存model/Core/VOICEVOX/3Craftと確認済みBGM108が必要。PhotoCraftのUNC durable-saveエラーを避け、同ツールの書込は専用F納品内の `photocraft-stage` へ限定する。

`qa/final-technical.json` は最終MP4全AVデコード、2460枚/82秒、音量/ピーク、13句のAAC/reference対応、912枚の実play画像対応を記録する。`qa/delivery.json` はFのnative3Craft再読込/保存/描画・欠損0・対応SHAを記録する。数値と抽出画像の検査は、実時間の全編視聴/試聴やYouTube公開確認とは別に報告する。
