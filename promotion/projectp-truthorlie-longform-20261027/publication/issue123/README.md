# TruthOrLie121：3予約の記録と未完のRelated（Issue123・Draft）

**3本の予約を確認済み、ShortのRelatedは未設定です。** 10/27 18:45の本編[pg8Ih4PAOBw](https://www.youtube.com/watch?v=pg8Ih4PAOBw)、19:15の[YT Short4mxdwqgsOVA](https://www.youtube.com/shorts/4mxdwqgsOVA)、[TT7701079834692209926](https://www.tiktok.com/@prop_pui/video/7701079834692209926)を記録しました。全てactualPublishAt=nullで、実公開・導線完成・視聴成果は未確認です。

[本編receipt要約](./youtube-long-scheduled.json) ／ [YT Short](./youtube-short-scheduled.json) ／ [TikTok](./tiktok-scheduled.json) ／ [Related必須残件](./related-status.json) ／ [F追記manifest](./append-delivery.json) ／ [Rootの最新判断](https://github.com/Pui-core/-/issues/123#issuecomment-6426951020)

## 予約記録の技術確認

本編708.01秒は横600秒条件を満たし、Short2版は40秒。各master/cover添付1・実schedule1、再送0。nativeの実ID・日時を正式receiptと結び付けています。本編receiptの保存時contentListRecheck=pendingは保持し、後続の同ID一覧18:45を別evidenceとして記録しました。YT Shortも19:15一覧と保存後title/description完全一致、kidsNo/paidNo/AIYes/ゲーム/defaulttags0を照合しました。UIAのoffscreen保存状態と全編目視は区別します。

TTは139文字single-line captionの完全一致リンク、19:15・Anyone・ownBrandOn/thirdOff/AIGCOn/HD/comments、最終著作権/簡易check問題なしを記録。Rootのnative cover pan40pxは元PNGの変更ではありません。

## 必須の未来作業：実Relatedを保存・再読込する

本編完全一致titleをnative pickerで検索した結果は一致なし。保存後フィールドも「なし」です。現在の本編は予約privateで、[公式条件](https://support.google.com/youtube/answer/14075157?hl=ja)の公開/限定公開を満たしていません。希望IDpg8Ih4PAOBwを、設定済みIDとは扱いません。

1. 18:45以降、同チャンネルの本編pg8Ih4PAOBwの実公開を確認。
2. 既存19:00 PM巡回または同時間帯のRoot1名が、新しい単独publisher leaseと実状態を確認。Short4mxdwqgsOVAへ同本編を設定し、保存・再読込で実IDを読む。
3. 19:15前までに設定できなければ、通常UIでこのShortの公開予約を止め、非公開で保持して実状態を記録する。他作品へは繋がない。
4. 実公開/連結receiptは予約原票を上書きせず別追記し、該当dailyへ反映する。24h/72hは実公開時刻から計算。

この作業は未実行です。**記録の技術チェック成功と最終受入を分け、Draft PR・Issue123 OPEN・worktree保持を続けます。最終APPROVE/merge/closeは保留**です。新cronは追加していません。

## 保全と範囲

Fのpublication/issue123/reservations-20261027へ、この時点の予約/未完Relatedの固定snapshotと正式3receiptコピーを追加しました。将来の実設定は別appendに残すため、今回のF snapshotを実行済みに書き換えません。元765payload・base・受入appendは保持し、固定5原票と指定3master/2coverだけをSHA照合。765全payload再走査なし。

次期1.03の操作例と架空回答で、公表1.02との差を保持。自作BGM108は背景採用で、日本人気曲/CML確認や音楽主題の投稿ではありません。全編直接視聴・主観試聴false、人数/収益化成果未達を維持。source担当のSNS GUI/browser/runtime/lease/daily操作0。public Gitは最小事実とbasename/SHAのみで、rawUI・画像・私的絶対パス・認証・モデル/SDK/メディアは含めません。
