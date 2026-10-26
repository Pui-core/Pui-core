# EMBERWAKE 最初の忘却・公開記録

[公開動画を見る](https://www.youtube.com/watch?v=a0TstalrQ64)

**2026年10月26日14:32:25 JSTに一般公開。** ProjectP本人channelの横動画で、実IDは `a0TstalrQ64`。制作は[PR40](https://github.com/Pui-core/Pui-core/pull/40)、管理は[Issue112](https://github.com/Pui-core/-/issues/112) / [親106](https://github.com/Pui-core/-/issues/106)。

## 公開確認の範囲

Rootが本人YouTubeの公開modal・公開日付を確認。匿名の公式watch pageもHTTP200、private=false、unlisted=false、playability=OK、本人channel、横動画（isShortsEligible=false）を確認した。タイトル・説明は納品版と一致し、公開された表紙JPEGをRootが直接目視してPhotoCraft表紙との一致を確認した。

設定は子ども向けNo・有料promotion No・AI開示Yes・category Gaming・Standard YouTube License。無関係な既定タグは今回のuploadだけから削除し、0/500文字。動画添付1回、custom cover添付1回、公開送信1回、再投稿0。公開時の著作権・communityのnative checksには問題の表示がなかった。

技術検査と抽出画像の目視は確認済み。**全編を実時間で直接視聴・試聴した判定ではない。** ローカル原本82.005秒、公開metadata82秒、native表示1:23を、それぞれ観測された値のまま記録する。source担当はGUI/SNSを操作せず、SHA固定のRoot公開receiptから必要な公開事実だけを転記した。

## 制作正本と追記

元のF納品は2561ファイル。動画・native原本・投稿文・元 `qa/delivery.json` を変更せず、今回の公開記録は `publication/2026-10-26-public/` に追加する。元投稿文の `published:false` 等は、公開前の制作snapshotとして保全し、現在の公開状態はこの追記で示す。

- 動画SHA: `820091fc29b802c845080a780c8f143751dc3b74bd22b88f617fd50b4fbbbb7b`
- 表紙SHA: `83c8523899cf947aa8ec67e1a4b7618e9b9f6a93fb0f98e55225f000caea3eb4`
- 元納品receipt SHA: `f7929865d575a4e363b46d295f9367267b46e753056fe6b9ef71d2641cd60d95`
- Root公開receipt SHA: `42b2fe4c3ea10ed23b1033dcb4eaae896cadf2e19f5fbe3c9ff84c96813cf5eb`

このフォルダの [publication.json](publication.json) は公開URL/時刻・設定・確認範囲を示す最小のredacted記録。私的なUI画像・raw receipt・認証情報・proofの私的パスはGitへ含めない。[originals-unchanged.json](originals-unchanged.json) は元F納品の不変確認、[append-receipt.json](append-receipt.json) は今回の追記ファイルだけの対応SHAを記録する。

## 計測と次の接続

- 24時間後: **10月27日14:32:25 JST**（05:32:25 UTC）。
- 72時間後: **10月29日14:32:25 JST**（05:32:25 UTC）。
- 初期表示の再生0は公開直後の観測で、評価は `not_due`。この追記は計測jobや運用runtimeを変更しない。

公開確認時点では、同じ本編の約束と忘却を使うShortはIssue114で実制作中。114から本動画へのnative関連動画設定は未実施。旧0.11の別の問いを扱う111とは自動的に関連付けない。自作BGM108はゲーム動画の背景素材として使用し、音楽主題の動画投稿にはしない。
