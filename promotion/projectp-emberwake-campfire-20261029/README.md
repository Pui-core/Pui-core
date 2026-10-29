# EMBERWAKE クラファン開始告知・PV

管理151の制作専管。実ゲームの跳躍・石の運搬を先に見せ、短いコピーと150BPMの音の拍で構成した60秒の縦PV。公開・NAS配送はRootの別工程であり、ここでの制作完了と区別する。

完成候補は `pv-v01/videos/emberwake-campfire-pv60-v03.mp4`。1080×1920、30fps、1800frames、映像60.000秒、AAC48kHz stereo。SHA256は `24fe267487fe22e6524fe3229d37af70057b3212104ca3fe7dbdd6e3dd98aa51`。

正規支援ページ: https://camp-fire.jp/projects/993744/view

目標50万円、2026年12月23日まで。Steam審査・特典納期・本編完成日・キー提供は確約しない。短尺の案内は「CAMPFIREで EMBERWAKE を検索」。プロフィール導線は実設定前に存在を断定しない。

正式Linux PhotoCraft0.15.1 / EffectCraft0.14.0 / FilmCraft0.10.0。専用Xvfb・XDG・CPU2・低優先で制作し、Windows GUI/入力/前面化/投稿は行わない。146の原本・素材は参照のみ。

制作物と依存の保存先: `F:/Videos/ProjectP-EMBERWAKE-Campfire-2026-10-29/pv-v01/`。Sourceには再現処理・非秘密の出典/QAを保存し、SDK/モデル/原録音/私的履歴を含めない。NAS配送と投稿はRoot専管。

編集可能な原本は `projects/wordmark.pcraft`、`projects/pv60-v02.ecproj`、`projects/closing-natural.ecproj`、`projects/pv60-v03.fcproj`。縦カバーは `covers/campfire-pv-cover.pcraft` とPNG/JPG。開始告知の横静止画は `private/announcement/` に保持した。ゲーム映像・モデル素材・全QAも同stageに保持し、動画以外をNASへ混ぜない。

`source/background.mjs` が固定した正式Linux CLIを、専用Xvfb/XDG・CPU2・低優先度で呼ぶ。新しい空stageでの制作順は、`assets.mjs` → `crop-assets.mjs` → `opening.mjs` → `render-opening.mjs` → `rear-assets.mjs` → `revised-assets.mjs` → `full-pv.mjs` → `render-full.mjs`。`cover.mjs` は同じ実ゲーム素材からPhotoCraftの保存・再読込・書出しを行う。既存出力を上書きして再実行する用途ではない。元ゲーム録画とCipher音源は出典SHAを照合してから使う。

締めのNaturalは、担当が新しいゼロPCMから正式Coreで作った無声素材を `natural-tail.mjs <MOV> <SHA256>` へ明示して合成した。56.4–60秒の108framesのみ、口は常に0、瞬きと軽い動きのみ。ゲームとCTAを遮蔽しない位置へ配置。原本の54.4秒のI-frameを境に、最後5.6秒だけEffectCraft/FilmCraftで再描画した。`render-natural.mjs` は尾部のtrack timebaseを1/15360へcopy remuxし、前半映像と原AACを結合する。最終の全60秒を描き直したとは扱わない。中断復帰 `--resume-mux` は完了済みNative入力の凍結SHAが一致する場合だけ使う。

実検査は最終MP4全AVデコード、1800個の一様な30fpsのPTS、先頭1632frameの新規decoded hash照合、AAC2814packetのpayloadとPTSの原本一致。曲は全60個の1秒区間で非無音、約−15.9LUFS/true peak−2.0dBFS。映像は全26場面の代表、主要遷移の連続frame、締めの実MP46枚とモデル入場22frameを目視した。元の不整合muxは不採用としてprivateに保全した。

出典・画面条件・制約は `qa/final-v03.json`、`qa/native-remap.json`、`qa/cover.json`、`qa/silent-core.json` に記録。選択場面では解法順の看板・出口・COMPLETE・結末を見つけていないが、個々の矢印やE/菱形など通常UIは残る。全ゲームのネタバレを監査したという主張ではない。直接の全編試聴と実時間通し再生は未実施。ownerの創作採用、公開、流入/支援/実売上は未確認であり、技術・限定目視の結果から昇格しない。
