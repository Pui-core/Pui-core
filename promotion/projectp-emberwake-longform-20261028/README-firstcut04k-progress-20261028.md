# EMBERWAKE 長尺04k 制作の途中経過

2026-10-28。前回の全編並列レンダーはEffectCraftのメモリ割当失敗で終了したため、不完全ファイルを保持し、重いレンダーは所有プロセス1本ずつへ変更した。ほかの作業は停止していない。

後半は第3話、第4〜6話、第7話以降、締めの13区間・69句・10045フレームを実出力。各動画の全AV decode・元WAVとの音声数値照合が成功。順序、映像SHA、実尺は `source/firstcut04k-story-agent-render-manifest.json`、音声照合は `qa/firstcut04k-story-agent-all-audio-correlation.json`。画像の抽出は全編連続視聴を意味しない。

前半は30句・4924フレームの原本を5つに分割。実出力済み区間は `qa/firstcut04k-act1-chunk*-attempt01-result.json` の存在するものだけ。続く個別レンダーと原画・入力画面、背景比較は別ジョブで作業中。完成済み・成功を推定しない。

PeriTune公式のRainwalkとSecret Corridorを背景用候補として取得し、公式利用条件と元ファイルSHAを `source/firstcut04k-bgm-candidates.json` に記録。どちらも曲そのものの投稿やContent IDへの楽曲登録をしない。動画への適合・耳での試聴・曲の採用は未確認。

`source/firstcut04k-full-plan-own.mjs` と `source/firstcut04k-full-assemble-own.mjs` は分割動画を繋ぐ未実行の構成・組立用スクリプト。`source/firstcut04k-city-own*.mjs` は対応する実収録とVOICEVOX原本を使う途中制作。BGM候補の組立も未実行。600秒以上の結合MP4・動画全編の視聴と音の聴感・創作品質の採用・投稿は未完了。PRはDraft／CHANGES_REQUESTEDを維持する。
