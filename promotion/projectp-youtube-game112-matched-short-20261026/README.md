# ProjectP：最初の忘却へつながるShort

管理 [Issue114](https://github.com/Pui-core/-/issues/114)、YouTube成長親106。本編112と同じ「約束を果たすために進んだ先で、最初の記憶を失う」という問いの26.2秒Short。旧0.11の芯石Short111と同じ続きを装わない。

## 動画と投稿先

F正本：`F:\Videos\ProjectP-YouTube-Game112-Short-2026-10-26\revision-01\index.html`

- YouTube：`videos/first-forgetting-short.mp4`。末尾は「約束から、最初の忘却まで。／関連動画の本編へ」。実112 ID `a0TstalrQ64` にnative関連動画を設定してからRootが公開する。
- TikTok：`videos/first-forgetting-short-tiktok.mp4`。同じ実話で、末尾だけ「このゲームの続きを、／フォローして見届けて。」。TikTokの500/1000フォロワー目標に合わせ、次のゲーム話をフォローする一本の動作にする。19:15は候補であり予約実績ではない。
- PhotoCraftカバー：`covers/first-forgetting-short.pcraft` / `.png`。Shortsへの実カバー設定可否・実選択はRootがnativeで別途確認する。
- 投稿文：`source/metadata.json` / `source/tiktok-caption.txt`。同service内で過去の同動画を再投稿していないこと、本人account、開示・1回送信・公開IDはRootが照合する。

## 実話と編集

冒頭から、実タイトル画面の「失った記憶0/15」と「1/15」を編集比較。出発前のルミとアッシュの約束、通常入力収録の3つ目の炉、クリア後の「ルミ。君だけは、忘れない。」、手帳の「公園でルミと走り回った午後」を見せる。

字幕の要約と元UIのピクセル引用を区別している。記憶の全喪失・ルミの名前の喪失・本人の初見感情を創作しない。本編制作版0.12.0/source71584a6の通常キー入力・physicsによる実録画を112の凍結納品から再使用。ゲームsource/セーブ/時計/進行は変更せず、HUDはPNG保存待ちを含むためRTA/タイム記録ではない。ゲーム音は未収録で、VOICEVOXと背景BGMを付与している。

## 声・モデル・音

VOICEVOX:青山龍星、既存7句（01/03/04/08/10/11/13）を語頭前の静けさと語尾まで全文再使用。元WAVの伸縮・語尾fade/cutなし。配置とPCM/AAC検査は `source/narration-cues.json` と `qa/final-technical*.json`。

指定Revenant_Natural（10/18版）の112で実Core描画したmovieを再使用。冒頭0–3.2秒→元model0–3.2秒、終幕21.8–26.2秒→元model7.6–12秒を対応させ、元の同じ声と同じ時刻関係を保つ。本Issueで新Core描画・人体trackingをしたとは称さない。モデル原本/SDKの公開再配布なし。

BGMは108の実SoundCraft0.12.1最終rev03「Connecting Lights」。全体master SHA `4d3bdac03c4bbcd89511ea637265bd13d56e0f11f6b702ca4f01b66af49c50df` の先頭26.2秒を背景に使用。声でduckし、最後0.75秒はBGMだけfade。音楽制作/MIX/完成MV/単体BGMを題材とした投稿はしていない。生音源/独立stem/生モデルをpublic Gitへ含めない。

## native原本と検査

- EffectCraft：`projects/first-forgetting-short.ecproj`、TikTok末尾専用 `projects/first-forgetting-short-tiktok.ecproj`。
- FilmCraft：各 `.fcproj` にnative EC picture・narration A1・background A2の3track。1秒254016000000tick、786frames/26.2s。
- PhotoCraft：実UI pixel cropと編集可能なカバー原本。AI画像生成による架空UIではない。
- 全AV decode、1080×1920/30fps、7句の全文PCM一致・AAC/reference同期、最終音量/peak、各cut前後の抽出画像、F native再open/save/render/missing0と全SHAを実行した結果で記録する。数値検査・画像目視を全編の直接再生/主観試聴へ読み替えない。
- 公開/関連動画の実設定・クリック到達・視聴成果・フォロー/YPP達成は制作検査と別。Rootの実receiptまでmetadataは未公開のまま。

## 制作中の必須修正

TikTok初回buildはsuffix付きの正しいJSXを書いた後、CLI3参照がYouTube JSX/projectのままになり、TT候補に「関連動画の本編へ」が残った。Root/独立QAの指摘を受け、初回owned renderの終了後に3参照を修正してTikTokだけ再描画した。誤版MP4/nativeと原票は `media/superseded-tiktok-cta/` / `qa/superseded-tiktok-cta/` に履歴保全し、公開候補にしない。修正の解除条件は最終TT MP4末尾画像、native保存文字、YouTube版と異なる最終SHAの一致確認。

直接の全編視聴/試聴は未実施。初期のAI/音源素材使用の開示を成長目的で省略しない。

検索CTAの技術修正成功・Root解除は保持した後、凍結前のCTO追加編集判断でTikTok主CTAをフォローへ変更した。この最終改版は初回参照不具合と区別し、検索CTA版のmaster/native/原票は `media/superseded-tiktok-search-cta/` / `qa/superseded-tiktok-search-cta/` に保全。114 TikTokだけの配分判断であり全動画への恒久ルールではない。YouTube masterの映像・音声・関連動画CTAは不変更。
