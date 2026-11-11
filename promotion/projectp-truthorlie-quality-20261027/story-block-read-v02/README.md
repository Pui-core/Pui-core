# 今回の1点と累計を分けた44秒修正版

19/33秒と35〜41秒に「今回 +1」「累計」を揃えました。比較の1と2は累計で、見抜く/だます報酬の違いではありません。この誤読を防ぐREAD003の実修正です。元44秒の語り口はCTOが限定採用済み、今回修正の解除判定は未達です。

[F検品入口](/mnt/f/Videos/ProjectP-TruthOrLie-2026-10-27/revision-02/story-block-read-v02/index.html) / [実MP4](/mnt/f/Videos/ProjectP-TruthOrLie-2026-10-27/revision-02/story-block-read-v02/videos/truthorlie129-rules-block44-read-v02-cipher.mp4)。44.010秒、H264 1920×1080/30fps/1320f、AAC48k stereo。SHA256 `822bce9f019086d9a5e12cfb6f395c9a0ef17657a29b7ed49e9d71b2d9724509`。

## 表示と滞在

単独画面は配役→今回+1→実スコア行→累計の順です。18.2〜21秒は累計0→1、32〜35秒は累計1→2。35〜41秒の比較は左右とも今回+1、各行の累計1/2、その下に累計1→2を置きました。今回獲得は単独64px/比較48px、累計は単独51px/比較45px。静止画の数値だけで可読性の解除にはしません。

[18.0〜21.2秒の連続AV](/mnt/f/Videos/ProjectP-TruthOrLie-2026-10-27/revision-02/story-block-read-v02/qa/read-continuity-first-score.mp4) は96f、[31.8〜41.2秒の連続AV](/mnt/f/Videos/ProjectP-TruthOrLie-2026-10-27/revision-02/story-block-read-v02/qa/read-continuity-second-score-and-comparison.mp4) は282f。最終masterから得点場面の前後を含めて切り出した検品用派生です。[連続観測票](qa/read-continuity.json) に最終masterのSHA、区間、6fps（5フレームおき）の77画像と時刻を記録しました。77画像を全30fps確認済みとは呼びません。

## 検証

EffectCraftで修正11.8秒を実描画し、FilmCraftのV2へ基礎映像と統合しました。最終全AVdecode、19フレーム抽出、既9句のAAC頭尾数値照合、-17.8LUFS/TP-2.0dBFSを確認。音声9句と既240fのRMS結合を保持した表示修正で、音声/モデルを新規生成したとは扱いません。

Fのこの別フォルダーからPhotoCraft/EffectCraft/FilmCraftを再読込・保存・描画、missing0、active参照が同フォルダー内に収まること、146項目source↔F SHA対応を確認しました。EC37秒の再描画PNGはprivate Native37秒とSHA一致です。

旧44秒SHA `948c5bfccf22e2b2002246b1fb6e54cedac559e6255a970bcb4e72ce8a9bef80`、75秒SHA `4596b64bb4f0d74715e7181c6bfcf028a834aea5bc90e0dd7e50813baa5b447e` は今回の制作後も不変。旧F/原本/予約票を上書きしていません。

今回のREAD003再判定、全編の連続可読性/テンポ/主観視聴・試聴/BGM採用、正式600秒はHOLDです。Mac配点2/連続ONの新3Rはまだ未採用で、静的予測を実素材扱いにしません。別製品PVのSource/Fにも変更していません。

VOICEVOX:青山龍星 / 指定Revenant_Natural / Cipher — Kevin MacLeod (CC BY4.0)。[曲帰属文](source/music-credit.txt) は投稿時の説明欄にも必要です。原モデル/SDKは不変・非同梱。共有GUI/browser/runtime/lease/SNS操作と公開は0、Draft/HOLD、独立WT/branchを保持します。
