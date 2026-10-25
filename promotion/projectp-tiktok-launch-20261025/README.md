# ProjectP TikTok初投稿・音源後付け用

[声・SFX入り／音楽なしMP4](videos/emberwake-voice-sfx-no-music.mp4) / [SFXのみMP4](videos/emberwake-sfx-only.mp4) / [完全無音MP4](videos/emberwake-picture-silent.mp4) / [カバー](covers/emberwake-cover.png)

2026-10-25のowner指示に基づく初投稿パッケージです。既存のEMBERWAKE追従RTA版V2を保持し、映像は変更せず、TikTok側で楽曲を後付けできる別版を制作しました。人気曲の選択・音源ID・利用できる区間・アプリ上の同期・公開結果は、本パッケージだけでは確認していません。公開担当はCTO rootです。

## 使用する版

- `emberwake-voice-sfx-no-music.mp4`：VOICEVOXによる説明と編集SFX。音楽は焼き込んでいません。TikTok楽曲を追加する場合の第一候補です。
- `emberwake-sfx-only.mp4`：編集SFXのみ。ナレーションなし、音楽なし。
- `emberwake-picture-silent.mp4`：音声ストリームのない完全無音映像。TikTok側だけで音を組む場合の素材です。
- `covers/emberwake-cover.pcraft`：実ゲーム画像を埋め込んだPhotoCraftの編集原本。文字・図形はネイティブレイヤーです。
- `projects/visual-source.ecproj`：既存V2を別保存・再リンク・ネイティブ再保存したEffectCraft原本。画面の変更は加えていません。
- `projects/voice-sfx-no-music.fcproj` / `sfx-only.fcproj`：映像の元音声を無効にし、新WAVを配置したFilmCraft原本。

動画は1080×1920、30fps、60秒。FilmCraftが書き出したAACだけを元動画のH.264と組み合わせ、全decoded video hashが元版と同一であることを検査します。FilmCraftでMP4全体を再書き出すと映像の再圧縮が入るため、最終納品版と同じ音声・映像を得る再現経路は `source/build.mjs native` です。

## 声と利用条件

**VOICEVOX:青山龍星（ノーマル／style ID 13）**。本人の肉声・録音・実際の発言とは扱わず、既存字幕の事実に基づく説明として合成しています。脚本と実測時刻は [narration-cues.json](source/narration-cues.json)、話速・各音声の実測長・SHAは [voice-timing.json](qa/voice-timing.json) を参照します。音楽・声真似・人物画像の生成は行っていません。

使用環境に同梱された青山龍星の `policy.md` は、個人による商用・非商用利用をクレジット付きで許可し、企業が携わる利用には事前確認を求めています。本制作はぷい本人の作品・個人活動の紹介として扱います。企業関与の案件へ転用する際はその条件を再確認します。資料: [VOICEVOX利用規約](https://voicevox.hiroshiba.jp/term/)、[VirVoxのVOICEVOX利用規約](https://www.virvoxproject.com/voicevoxの利用規約)。同梱確認範囲は [voice-license.json](qa/voice-license.json)。

## TikTokでの音源後付け

現在の編集基準は120BPM、1拍0.5秒、30fpsでは15フレームです。[beat-map.json](source/beat-map.json) に全拍、実カット時刻、拍との差、編集SFXの時刻を記録しています。**既存のすべてのカットが拍上にあるわけではありません。** 例:3.2、6.8、9.8、26.2秒は0.5秒の拍からずれます。

1. TikTokで実際に利用可能な曲と区間を選び、曲名・作者・音源ID/URL・確認日・許諾範囲を公開担当が記録します。
2. 選んだ曲の分かりやすい強拍を映像0秒に合わせます。120BPMまたは等価な倍/半テンポが扱いやすい基準です。曲のBPMを未実測のまま一致扱いにしません。
3. ナレーション版では元音を残し、追加音楽を声が読める音量へ下げます。画面の音量スライダーは実dBとは限りません。冒頭、9.95秒の短句、48.2秒、54秒の案内を含めて実際のプレビューを聴きます。
4. 語頭・語尾とSFXの着地が合い、曲が終盤で不自然に切れないかを確認します。曲の区間が60秒に足りない場合や曲の拍が合わない場合は、公開前に区間か編集を修正します。

この手順は音源後付け準備です。未選択の曲を「人気楽曲同期済み」と報告せず、TikTokでの選曲・プレビューをもって公開判断します。

## 出典と表現の範囲

映像は [Issue #89](https://github.com/Pui-core/-/issues/89) の実ゲーム探索モード・実メニュー・GDScript抜粋・ラベル付き3D開発イメージです。TIME ATTACKとローカル自己ベストは実装の紹介で、映像はRTA完走・PB更新・タイム短縮の記録ではありません。CAMPFIREは2026-10-25確認時点で公開準備中、正式支援URLはありません。募集開始、金額、リターン、完成日、ランキングを追加していません。

カバー画像は既存の実ゲームフレームをPhotoCraftで配置・組版しています。生成AI画像への置換は行いません。編集SFXは既存V2の決定的な合成音で、実ゲームSEとは区別します。

## 再制作と検証

WSL Node.js、Windows PhotoCraft 0.15.1、EffectCraft 0.14.0、FilmCraft 0.10.0、既存FFmpegを使用。素材入口は直前の `../projectp-emberwake-rta-v2`、または `PROJECTP_PRIOR` で指定します。

```bash
node source/build.mjs prepare
node source/build.mjs audio
node source/build.mjs cover
node source/build.mjs native
node source/build.mjs verify
node source/check-audio-sync.mjs
node source/build.mjs package
```

`audio` はlocalhost:50025で稼働する実VOICEVOXエンジンを使用します。自動起動・停止や外部ネットワーク公開は行いません。PhotoCraftのpcraft保存ではWSL共有パス上のdurability確認に失敗したため、Windows一時ディレクトリへネイティブ保存し、SHA一致を確認してLinux worktreeへコピーします。最終Fドライブ納品先では、全ネイティブ原本をその場所から再読込・保存・描画します。既存出力先を上書きしません。

納品先: `F:\Videos\ProjectP-TikTok-Launch-2026-10-25`。元版と他案件は保持します。Gitでは同一の旧素材の重複を除き、`prepare` で復元する構成です。納品先には必要なリンク素材を含めます。

[final-verification.json](qa/final-verification.json) は全デコード・形式・元映像不変・音量測定を、[delivery.json](qa/delivery.json) は納品先からの原本再読込・保存・描画とSHAを記録します。抽出画像の目視、全編実時間視聴・試聴、実機TikTokプレビュー、投稿、公開後分析は別の確認です。実施していない工程をPASSとして記録しません。

音声は最終AACで-19.4LUFS、true peak -3.3dBFS。SFX版と声入り版の各3区間をWAVと比較し、AACによる21.3ms（0.64映像フレーム）の遅延と相関0.9986以上を測定しています。[audio-sync.json](qa/audio-sync.json) は数値的な時刻対応の確認で、楽曲の実聴・自然な読み・TikTokでの音はめの採用判定を意味しません。最後のナレーションは約56.56秒までで、60秒の終端に語尾を切る位置はありません。

管理: [制作 #94](https://github.com/Pui-core/-/issues/94) / [成長目標 #93](https://github.com/Pui-core/-/issues/93)
