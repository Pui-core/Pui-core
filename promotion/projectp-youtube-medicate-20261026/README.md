# medicate：YouTube横MVの公開準備

**ぷい - medicate【Official Music Video】**

owner採用済みの全曲MV v9を、音・映像とも変更せずYouTubeへ渡す公開用パッケージです。1920×1080／30fps／約2分48秒。専用サムネイルはPhotoCraftの筆圧ストロークと編集可能な作者名で制作しました。

[サムネイル](./thumbnail/medicate-youtube.png) ／ [タイトル](./metadata/title.txt) ／ [説明文](./metadata/description.txt) ／ [投稿設定・状態](./metadata/youtube-publication.json) ／ [見やすい案内](./index.html)

## 現在の状態

**公開準備済み、実公開は未確認です。** 投稿先は既存のProjectPチャンネル `UCZsCpCNJ-BBKEv7EMz1P73Q`。実動画ID・公開時刻・公開receiptは、Rootが本人のYouTube Studioで実結果を確認した後に追加します。準備資料から公開成功・収益化・関連Shorts公開を推定しません。

元MVは[制作109](https://github.com/Pui-core/-/issues/109)が指定する、MV-001として採用済みの既存作品で、今回新しく全曲を制作したとは説明しません。人物の静止素材へのカメラ演出を連続した本人の実演や撮影と呼ばず、説明文にAI素材と編集の使用を記載しています。必要なaltered-content等の設定はRootが実画面で確認します。

## 納品と編集原本

Windows納品：`F:\Videos\ProjectP-YouTube-medicate-2026-10-26\revision-01-publication`

- 全曲：`videos/medicate-v9-youtube-handwritten-final.mp4`
- サムネイル：`thumbnail/medicate-youtube.png`
- PhotoCraft原本：`native/medicate-youtube-thumbnail.pcraft`
- 原本からの再描画：`qa/thumbnail-reopened.png`
- 編集用素材と操作記録：`assets/thumbnail-background.png`、`source/thumbnail-actions.json`
- 投稿文・設定：`metadata/`

全曲master SHA256：`dcbe6c5d7ab3acb9130ef94bde0dde3da13ddf39a51460aba901afe72078dcbe`。元と納品copyのbyte一致を確認し、再エンコード・音量処理・映像再編集はしていません。

この公開Git保存先には、全曲音声/動画・生成原画・それらを含むnative原本を再収録していません。最終サムネイル、投稿文、再構築用の[PhotoCraftレシピ](./source/build-thumbnail.mjs)、公開可能なQAだけを保存しています。編集可能な原本と全素材は上記のowner納品にあります。既存素材を用いて再制作する場合は、新しい納品revisionを選んでレシピを実行します。

## 確認した範囲

PhotoCraftの実描画、F納品先から原本の再読込・保存・再描画、PNG一致、1280×720と320×180での静止目視、媒体SHAと形式を照合しました。[サムネイルQA](./qa/thumbnail-native.json)と[媒体確認](./qa/media-source.json)に範囲を残しています。Rootもサムネイルを静止目視済みですが、アップロード後の実表示・公開確認は別です。今回のパッケージ工程で、全曲の直接試聴・全編連続の目視をしたとは記録しません。

筆文字の原クレジットは[元ファイル](./metadata/handlettering-credit-original.txt)をbyte保持し、説明文へ帰属・出典・ライセンス・変更内容の段落を原文のまま含めました。テンプレート末尾の編集者向け追記指示は、完成した公開説明へ載せていません。KanjiVGの表示は文字素材に適用され、別の楽曲や映像までCC BY-SAとする説明ではありません。

管理：[制作Issue109](https://github.com/Pui-core/-/issues/109) ／ [YouTube継続目標106](https://github.com/Pui-core/-/issues/106)。音楽のContent ID独占登録、印税の受取、YPP承認はこのMVの準備・公開とは別に確認します。
