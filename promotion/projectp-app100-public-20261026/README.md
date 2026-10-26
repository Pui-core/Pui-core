# アプリ動画100：10月26日16:00の実公開

[公開TikTok動画](https://www.tiktok.com/@prop_pui/video/7700784029481716999)は、本人prop_puiの予約時と同じIDで、**2026年10月26日16:00 JST（07:00 UTC）** に公開されたことを確認しました。Rootが07:01:44 UTCに公式公開ページを匿名で1回GETし、status0・本人author・privateItem=false・createTime1792998000・22秒を照合した記録です。新投稿・再送・共有OS操作は0です。

## 何を確認したか

これは公式公開metadataの確認です。今回のnative投稿一覧・動画の直接再生・全編視聴/主観試聴は未実施で、匿名ページの取得をそれらへ広げません。素材は10/25の開発画面と検証データを使った静止画の拡大・編集で、タップ操作の録画やアプリの一般公開を示す動画ではありません。

投稿文は、凍結したF元captionのSHAを確認した別観測で照合しました。入力192文字/公開190文字で、**空白正規化後は一致**、trim後の文字列そのものは完全一致ではありません。

最初の正式公開receiptの `descriptionExactWithSchedule=false` は、予約receiptに存在しない `schedule.caption` フィールドとの比較で生じた値です。この値を本文内容不一致の証拠と扱わず、別の正しい照合観測を参照します。正式receiptは上書きしていません。

- 正式公開receipt SHA：`be81052e1b694ab543a0f161480ca85c4cbecbebc0c372cb2cfcaf721ff802e3`
- 別caption照合 SHA：`302490e2eb06db085eb018c1f858ada18fbf06269bb8572facca445e14879b9e`
- 元caption SHA：`f2b083f31e20ddbd8e22b64bd7ddd7773b4251772d609c5244788cec76cacf76`

## 次の分析期限

- 実公開から24時間：**10月27日16:00 JST**
- 実公開から72時間：**10月29日16:00 JST**

取得時は公開後約1.75分で再生数表示0。これは早期の観測で、視聴維持・完視聴・フォロー転換や配信制限を判定する材料にはしません。今後の実測は[親93](https://github.com/Pui-core/-/issues/93)で追跡します。11月末500/年末1000フォロワー・YouTube収益化の目標達成とは区別します。

## 原資料の保持と追記

元App100の動画 `a28dc095775670380fca6551f7c394a6d719601109b98999a4531e25f7213eee`、カバー、モデル、3Craft原本、旧manifest・正式運用receiptは変更しません。F `ProjectP-Missyou-Stamp-2026-10-27/revision-01-live2d/publication/2026-10-26-public/` にこの3文書だけを別appendとして保存します。元folderの「2026-10-27」は実投稿日ではなく、今回の実公開日10/26を記録し、元の日付に同じ動画を再投稿しません。

[管理Issue116](https://github.com/Pui-core/-/issues/116)のsource限定記録です。source担当はGUI/SNS/Root runtime/leaseへ触れず、再描画・新テスト・広い監査を追加していません。private UI・raw HTTP・auth・clipboard・trackingをコピーせず、必要な公開事実と確認範囲だけを残します。
