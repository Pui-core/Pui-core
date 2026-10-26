# TruthOrLie121旧版：公開採用撤回・停止確認中（Issue123・Draft）

**owner品質差し戻しにより、旧版の公開採用を撤回しました。旧本編へのRelated設定・19:15公開の指示は失効しています。** 新制作は[Issue129](https://github.com/Pui-core/-/issues/129)で、60〜90秒の実編集サンプルから品質を再判定します。新しい公開時刻は品質受入後に決め、旧夕方枠へ押し込みません。

[現在のHOLD/部分停止確認](./quality-hold-status.json) ／ [失効したRelated計画の履歴](./related-status.json) ／ [管理123](https://github.com/Pui-core/-/issues/123)

## 08:15時点で確認できた範囲

- 本編pg8Ih4PAOBw：08:14:20 JSTのnativeで、同IDの行が「非公開」「アップロード日」へ変わり、変更保存完了の通知を確認。通常保存click1。独立した通常再読込は入力0で行われておらず、再検証待ちです。
- YT Short4mxdwqgsOVA：停止確認は未完。
- TT7701079834692209926：停止確認は未完。
- Rootの次窓08:25〜08:30は予定として記録し、このsnapshotで実行済みとはしません。全3件取消済みとは報告しません。

現在の作業は旧予約の停止・非公開保持と実状態確認です。旧18:45実公開→19:00Related→19:15Short公開の指示は実行しません。runtimeのRelated requiredはowner_quality_hold_stop_old_reservations_pendingへ更新済みですが、source担当はruntime・GUI・browser・lease・SNSを操作していません。

## 保存する旧予約の履歴

本編[pg8Ih4PAOBw](https://www.youtube.com/watch?v=pg8Ih4PAOBw)18:45、[YT Short4mxdwqgsOVA](https://www.youtube.com/shorts/4mxdwqgsOVA)と[TT7701079834692209926](https://www.tiktok.com/@prop_pui/video/7701079834692209926)19:15を予約した当時の事実は保持します。これらのimmutable receiptを現在の停止状態へ上書きしません。

[旧本編予約要約](./youtube-long-scheduled.json) ／ [旧YT Short予約要約](./youtube-short-scheduled.json) ／ [旧TT予約要約](./tiktok-scheduled.json) ／ [予約時F snapshot manifest](./append-delivery.json)

Fのpublication/issue123/reservations-20261027は、予約と旧Related未完を保存した時点の固定履歴です。現在の命令ではなく、書き換えていません。今回HOLDと停止結果は別appendに残す準備中で、最終2残件と本編再読込の証跡を待ちます。元765payload/base・旧受入・3master/2coverも保持します。

## 保持する判定

ownerの品質指摘はP1未解除。テンポ/ジェットカット、主従・余白・黄金比を意識した美しさ、BGM差し替え比較を新制作129で扱い、旧108固定採用も撤回します。横600秒以上、実操作例/架空回答の明示、3Craft/Core/声の保全は継続。全編直接視聴・主観試聴falseを保持します。129制作prefixはこのrecord担当の変更範囲外です。

Draft PR57・Issue123 OPEN・WT/branch保持を続け、merge/close/cleanupは行いません。停止完了や新品質採用、公開/人数/収益成果は未確認です。public Gitは最小事実とbasename/SHAのみで、rawUI・画像・私的絶対パス・認証・モデル/SDK・メディアを含めません。
