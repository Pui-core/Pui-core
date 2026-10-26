# app100の有限公開確認 — native読取で阻害

[管理Issue115](https://github.com/Pui-core/-/issues/115)による2026-10-26の追加観測。対象は本人 `prop_pui` の[同一動画7700784029481716999](https://www.tiktok.com/@prop_pui/video/7700784029481716999)。制作100の再制作・再投稿は行っていない。[親93](https://github.com/Pui-core/-/issues/93)はOPENで継続する。

## 今回の期待値と実際

本人Studioの当該ID・public状態・実公開時刻をnative UIで確認する予定だった。既存Firefoxへのstrict probeは07:10:04 UTCに成功し、指定readerの固定identityも一致した。Windows絶対pathへ変換した既設PS1を、返却identityと `Action=read, Service=tiktok` で1回だけguarded runした。

readは07:10:19 UTCにexit 1。安全な診断は `OPERATION_EXCEPTION / System.Management.Automation.ParseException / ParserError / line20 offset171 / HRESULT 0x80131501`。`operationInvoked:true`は成功を示さず、stdoutは空でnative原票は取得できなかった。本人account・public行・実公開時刻・終端Homeは今回未確認。接続成功を本人確認・公開確認へ読み替えない。既設scriptの修復・再実行・guard弱化・別経路への切替は行っていない。

[新receipt](receipt.json)の `publicConfirmed`、`actualPublishedAt`、24h/72hはnull。これは今回のnative観測の結果であり、着手前の公開情報を取り消すものではない。

## 着手前の公開metadataとの区別

着手前のruntime `2026-10-26-app100-public.json` は、07:01:44 UTCの匿名公式ページmetadataで本人・同一実ID・public・createTimeを確認した別receipt。SHAは `be81052e1b694ab543a0f161480ca85c4cbecbebc0c372cb2cfcaf721ff802e3`。そこには実公開16:00 JST、24h＝10/27 16:00、72h＝10/29 16:00が記録されている。今回その公開ページの再取得・実再生・nativeによる時刻確認はしていない。既存のmetadata由来の公開状態・時刻・dueと原receiptを不変更で保全し、今回のnative成功とは区別する。

以前の[予約source receipt](../../../projectp-growth-20261026/qa/publication/2026-10-26-app100-scheduled.json)は予約時点の履歴。時刻経過・予約row・汎用toastだけでは公開証明とせず、観測時刻を公開時刻に代用しない。初期0を内容の敗因・配信制限・フォロワー目標達成とも扱わない。

## 排他・操作予算と保全

- Issue115の明示nominationを照合し、daily.lock/flock下で指定された両released SHA・旧holder/runId・handoffをCAS確認。旧原票をprivate backupし07:09:39 UTCにleaseを取得。期限の算出を別clock readで行ったため、設定TTLは900001ms（上限15分に対し1ms超過）だった。この設定値逸脱をPASSにせず原票に保持。実保持は87.285秒で、15分以内に解放した。
- 共有画面区間を会話で事前宣言。07:10:01〜07:10:19 UTC、18.193秒 / 最大180秒。read 1回、tab選択・navigation・zoom変更0。投稿・添付・cover添付・送信・予約・削除・profile save intentは全て0。
- 07:11:07 UTCにown claim・lease・nominationをCAS照合して解放。取得・終了・handoff原票と失敗stdout/stderrをprivate tmpへ保持。Gitには安全な要約とSHAだけを保存し、rawUI・socket・PID/HWND・内部publisher識別子・lease原本を含めない。
- 日次はapp100の新観測claim・参照だけを追記。既存public metadata項目、他post、legacy top-level、旧receipt・取消原票は不変更。99取消、109/110音楽hold、114の同一ID `7700862636182850822` / 19:15予約を維持。
- [保全要約](originals-unchanged.json)に元217 tracked fileの検証範囲を記録。READMEは末尾追記、他216件はbyte不変。動画・音・cover・3Craft原本・旧QAの再生成はなく、F同期も実施していない。旧delivery receiptは以前の納品範囲の証跡として保持する。

## 残る確認と引継ぎ

必須のnative公開確認は阻害のまま。Issue115と親93へ具体理由・private原票保持場所を報告し、既存CTO→PM-ReviewGate→PM-Dispatcherへhandoffした。次のnative確認には既設PS1の別の根拠付き修復と新たな単独publisher指名が必要。公開未知を理由に再投稿しない。新cron・常駐loop・接続/認証/料金/global環境の変更はない。

今回の検証対象は新JSONの実ID/account/SHA/null/予算整合、失敗原票SHA、非対象daily/旧runtime記録/旧sourceの不変、変更scopeと内部リンク。制作の全編再検品・直接試聴・24h/72h分析・人数成果を新たにPASSとしていない。
