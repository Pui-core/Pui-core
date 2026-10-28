# EMBERWAKE 長尺04k 制作の途中経過

2026-10-28。前回の全編並列レンダーはEffectCraftのメモリ割当失敗で終了したため、不完全ファイルを保持し、重いレンダーは所有プロセス1本ずつへ変更した。ほかの作業は停止していない。

後半は第3話、第4〜6話、第7話以降、締めの13区間・69句・10045フレームを実出力。各動画の全AV decode・元WAVとの音声数値照合が成功。順序、映像SHA、実尺は `source/firstcut04k-story-agent-render-manifest.json`、音声照合は `qa/firstcut04k-story-agent-all-audio-correlation.json`。画像の抽出は全編連続視聴を意味しない。

前半は30句・4924フレームの原本を5つに分割。実出力済み区間は `qa/firstcut04k-act1-chunk*-attempt01-result.json` の存在するものだけ。続く個別レンダーと原画・入力画面、背景比較は別ジョブで作業中。完成済み・成功を推定しない。

PeriTune公式のRainwalkとSecret Corridorを背景用候補として取得し、公式利用条件と元ファイルSHAを `source/firstcut04k-bgm-candidates.json` に記録。どちらも曲そのものの投稿やContent IDへの楽曲登録をしない。動画への適合・耳での試聴・曲の採用は未確認。

`source/firstcut04k-full-plan-own.mjs` と `source/firstcut04k-full-assemble-own.mjs` は分割動画を繋ぐ未実行の構成・組立用スクリプト。`source/firstcut04k-city-own*.mjs` は対応する実収録とVOICEVOX原本を使う途中制作。BGM候補の組立も未実行。600秒以上の結合MP4・動画全編の視聴と音の聴感・創作品質の採用・投稿は未完了。PRはDraft／CHANGES_REQUESTEDを維持する。

## 12:38 JSTの追加状況

前半5区間と原画・入力84.586秒を実MP4として完了、全AVデコードとフレーム数を確認。背景比較の初版は拡大で元UI文章が切れたため採用せず、字幕を除いた既存の同話収録を使う別版 `firstcut04k-city-clean` を作成し、代表画像で確認した。

`source/firstcut04k-full-plan-own.json` は、前半、第3話〜各話、原画／入力、背景比較と締めを順序に沿って配置し、114句の重複0・18616f（620.533秒）を算出。元音声と実画面を使い、無音や静止映像で尺を引き延ばしていない。元のu005とu097/u101の台詞は独立音声として挿入した。FilmCraft原本 `projects/firstcut04k-full-own.fcproj` を作成し、実InspectでV1/A1各27区間・先頭0／終端18616f・隙間0を確認。12:38時点、所有jobの本編MP4書き出しが実行中。部分ファイルを完成扱いしない。実際の全AV decode・主要境界の表示・全編視聴と音の聴感はまだ未検査。

Rainwalk候補は10分20.533秒のBGM用トラックとして生成したが、映画全編への統合・聴感・クリエイティブ採用は未完了。音源単体の再配布・Content ID登録はしない。初回背景比較の元UI文字切れ版も保全し、採用しない。
