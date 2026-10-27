# 得点の行き先を比べる実44秒ブロック

P1の構成差し戻しに対して、個人的な架空回答を推測させる導入を外し、条件を先に伝えて実2ケースの得点を検証するブロックを制作しました。全600秒の本編は未完成、全編主観視聴/試聴は未達です。CTOはこの44秒の語り口に限って採用しましたが、累計1/2が今回獲得の違いに誤読され得るREAD003を差し戻しました。[修正版](../story-block-read-v02/README.md) を別に保持しています。

[Fの検品入口](/mnt/f/Videos/ProjectP-TruthOrLie-2026-10-27/revision-02/story-block/index.html) / [実MP4](/mnt/f/Videos/ProjectP-TruthOrLie-2026-10-27/revision-02/story-block/videos/truthorlie129-rules-block44-cipher.mp4)。44.010秒、H264 1920×1080/30fps/1320frame、AAC48k stereo。SHA256 `948c5bfccf22e2b2002246b1fb6e54cedac559e6255a970bcb4e72ce8a9bef80`。

冒頭3.4秒で実「嘘5→投票2」と誰に1点かの問い、10秒までに今回の得点条件を示します。実R1はAA出題/BB推理で3→3が的中しBBに1点。役割交代後のR2はBB出題/AA推理で5→2が外れ、BBにさらに1点。実スコア行の「このラウンド+1」と合計1→2を比較します。答えの内容を5件ずつ読み上げず、条件・選択・結果・配役の変化に絞りました。

## 実制作と検査

- 新VOICEVOX9句を自然な全句で配置。指定Revenant_Naturalを新声RMSからCore240frame/8秒描画し、3.5〜8秒に表示。旧75秒の口パクを新声へ転用していません。
- PhotoCraftの背景原本を再利用し、EffectCraftの44秒をFilmCraft V1/A1/A2へ実統合。Fから3Craftを再読込・保存・描画、missing0、active参照がstory-block内に収まることを確認。
- 最終AV全decode、13frame抽出、9/9AAC頭尾数値照合。最終-17.8LUFS/TP-2.0dBFS。61項目のsource↔F package SHA対応。
- 初回の構文失敗とプレビュー差し戻しはprivate履歴に保持。最終では、回答カードに被ったモデルを冒頭3.4秒は非表示とし、結果カード右上の無関係な紫UIも除いています。
- 元の75秒MP4/原本は変更していません。これは600秒の代替動画ではなく、正式構成の一ブロックです。

実次期版1.03(23)、固定製品pin `5b11516bba2be105f44c444eb6352eb757a8abd3` の通常UIを自動操作した例。名前と回答は架空です。配点1は今回の設定です。原1178×2556とSHAを追跡し、得点/画面を書き換えません。源流・選択frame時刻・実結果は [素材結合票](qa/story-evidence-binding.json) で確認できます。

[BGM帰属文](source/music-credit.txt) はYouTube説明欄にも必要です。Cipher / Kevin MacLeod / CC BY4.0は比較候補、主観採用/実upload claimは未観測。VOICEVOX:青山龍星/指定モデルのcreditを保持し、任意YouTube AIタグOFFの方針を維持します。モデル/SDK原本は不変・非同梱。

P1と全編の可読性/テンポの受入は、この実動画で再判定します。静止フレーム・出力成功・数値だけでは解除しません。共有GUI/browser/SNS/runtime/lease操作0、未公開。Draft/HOLD、独立WTとbranchを保持します。
