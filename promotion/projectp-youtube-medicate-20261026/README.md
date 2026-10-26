# medicate：保存済みMVと投稿停止の記録

**ぷい - medicate【Official Music Video】**

**最新owner指示により、完成MVを含む音楽関係の動画は投稿しません。** 本資料は作成済みの全曲MV v9・サムネイル・投稿案の保管記録です。1920×1080／30fps／約2分48秒。動画・音は変更せず、専用サムネイルはPhotoCraftの筆圧ストロークと編集可能な作者名で制作しました。

[保存済みサムネイル](./thumbnail/medicate-youtube.png) ／ [保存済みタイトル案](./metadata/title.txt) ／ [保存済み説明文案](./metadata/description.txt) ／ [現在の停止状態](./metadata/youtube-publication.json) ／ [見やすい案内](./index.html)

## 現在の状態

**`owner_hold_no_publication`：公開待ちを撤回し、投稿しません。** 2026-10-26、最新owner指示「完成MVも含め、音楽関係の動画は投稿しない」をRoot経由で受領しました。このMVを自動再投入せず、公開receiptも待ちません。

当初の候補先は既存ProjectPチャンネル `UCZsCpCNJ-BBKEv7EMz1P73Q` でした。Root報告では、今回のファイル選択はnative Open前に停止し、動画ID・公開intentはありません。公開成功や公開後の削除・非公開化を行ったとは記録しません。作成済み原本・媒体・投稿案を保管し、停止は成果物の削除と区別します。

停止記録は[owner-hold](./qa/owner-hold.json)、停止前の準備状態は[旧metadata](./metadata/history/youtube-publication-pre-owner-hold.json)と[旧納品receipt](./qa/history/delivery-pre-owner-hold.json)を参照してください。準備sourceのPR35は履歴として保持します。YouTube継続目標106はゲーム/アプリ等で継続し、非公開BGM制作108を音楽動画の投稿許可へ読み替えません。

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

この公開Git保存先には、全曲音声/動画・生成原画・それらを含むnative原本を再収録していません。最終サムネイル、保存済み投稿案、再構築用の[PhotoCraftレシピ](./source/build-thumbnail.mjs)、公開可能なQAだけを保存しています。編集可能な原本と全素材は上記のowner納品にあります。レシピの保存を、新しい音楽動画制作や公開の指示とは扱いません。

## 確認した範囲

停止前に、PhotoCraftの実描画、F納品先から原本の再読込・保存・再描画、PNG一致、1280×720と320×180での静止目視、媒体SHAと形式を照合しました。[サムネイルQA](./qa/thumbnail-native.json)と[媒体確認](./qa/media-source.json)は当時の技術確認です。Rootのサムネイル静止目視も投稿許可・公開証明にはしません。今回のパッケージ工程で、全曲の直接試聴・全編連続の目視をしたとは記録していません。停止反映では媒体を再処理せず、小文書と状態だけを更新しています。

筆文字の原クレジットは[元ファイル](./metadata/handlettering-credit-original.txt)をbyte保持し、説明文へ帰属・出典・ライセンス・変更内容の段落を原文のまま含めました。テンプレート末尾の編集者向け追記指示は、完成した公開説明へ載せていません。KanjiVGの表示は文字素材に適用され、別の楽曲や映像までCC BY-SAとする説明ではありません。

管理：[制作Issue109](https://github.com/Pui-core/-/issues/109) ／ [YouTube継続目標106](https://github.com/Pui-core/-/issues/106)。音楽のContent ID独占登録、印税の受取、YPP承認はこのMVの準備・公開とは別に確認します。
