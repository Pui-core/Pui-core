# #142 モデル反映版長尺の予約準備

[管理Issue #142](https://github.com/Pui-core/-/issues/142)。141の正式Revenant_Natural Core/RMSを使ったv07の受入後に、本人YouTubeへ1回だけアップロードし、2026-10-29 12:15 JSTの予約を第一候補とする。旧v06を代わりに添付・公開しない。GUI・lease・投稿はRoot専管で、制作担当はhelperと非秘密証跡をこのディレクトリだけに保存する。

現在は141 v07の最終動画受入・一回添付、新VID凍結、タイトル・説明・NoKids、Gaming、指定カバー、公開設定への遷移までRootが確認した。予約日時の入力と保存状態を検証中で、公開/予約Submitは0。予約候補は最適時刻の実証ではない。

- `youtube142-entry-control.ps1`: readと公開済み134の完了paneを閉じる操作だけ。本人channel・選択YouTubeタブ・ブラウザーPID/Session/birth/HWND・5alias/有限窓・134のpublic canonicalを確認し、pane14614内のshare14701/公開日と、Rootがfresh観測した下の閉じる14713だけを再確認する。Rootが04:51:51 JSTに標準Invoke1回を実施。上の閉じる14640や他の画面は操作しない。
- `youtube142-upload-stage.ps1`: read、作成9837、fresh RuntimeID/Nameの「動画をアップロード」menu/buttonだけ。本人と所有・期間を各回確認し、既存の完了pane・空upload modal・title edit・upload段階タブがあれば追加openを拒否して保全する。「ファイルを選択」や添付・最終Submitの経路はない。

両方ともUTF-8 BOM。標準UIA Invokeだけを使用し、OS focus、グローバルキー・マウス、認証処理、任意の低レベル入力fallbackを持たない。helper本体の実操作はRootのみ、制作担当のPowerShell起動はParser.ParseFileによる構文検査だけで、未実行を動作済みと扱わない。[現在の記録](progress.json) にsource baseとscript SHA、sanitized実結果、未確定を記録する。raw UI、lease内容、SDK/MOC、動画本体をGitへ入れない。

最終asset/prepared/SHAは下段のとおり凍結済み。今後は新videoIDを凍結し、所有filepicker・metadata/credit・NoKids・native checks・予約日時を実値で照合する。添付と最終Submitは別のCreateNew一回intentを置き、不明な結果を再送しない。同題Short111のRelatedは新長尺がpublic/unlistedで利用可能になってから確認し、別物語の旧114/117へ差し替えない。

## v07受入とファイル選択の準備

Rootが141のv07を受け入れ、`prepared-v07.json` を凍結した。prepared SHAは `d487b218626f916c1ca281fa7f58fc306ff5bcdd8d657bc846af3b244aee3fec`、BGM動画SHAは `ce39d1223e7a9dfc59488b9c828f5c44bac363fd59334484f519f5dbbdef7241`。制作Issue141・acceptedRevision v07・rootMediaAccepted・Root受入URLも検査し、ファイル名から版を推測しない。Rootは作成とアップロードmenuを各1回Invokeして空modalを確認した。この準備段階では142のファイル選択・添付・Submitは0で、その後の実一回添付を下段に記録する。

- `youtube142-file-select.ps1`: 受入済みv07とpreparedの実SHA、本人・有限窓・空modal/header15771/fileSelect15859を照合し、標準Invokeでfilepickerを開くだけ。ファイル添付はしない。
- `youtube142-filepicker-probe.ps1`: read-only。正規ownerchainの標準filepickerと同Sessionを照合し、ファイル名Edit1148とOpen1のみを調べる。ファイル名host親3段は型/ID/対応UIA patternだけを出し、ディレクトリ一覧や他窓内容を収集しない。入力の自動fallbackを持たない。

未実行のprobe草案にJSの置換文字列内の `$'` 展開による本文重複があり、独立静的reviewで検出した。旧草案は実行せず、callbackでliteral挿入して再生成。tab/doc条件各1行・本文1回を確認し、2本とも実PowerShell `Parser.ParseFile` のerrors0を確認した（helper本体は実行していない）。修正版SHAをRootへ渡し、独立reviewでも旧指摘解除・新たな重大指摘なし。記録は `syntax-frozen-v07.json` と `progress.json`。

## 標準filepickerと一回添付

Rootの実probeで、ファイル名EditとCombo hostにUIA ValuePatternが無いことを確認した。この観測後、Rootが別の専用標準controlメッセージ経路を明示的に選定した。`youtube142-standard-filepicker.ps1` は観測済みDialog30805784/PID21108/Session/birth/ownerchain、Edit219288902 ID1148のES_READONLY false、Open24122864 ID1、class/visible/enabled、本人と有限窓、受入済みv07実SHAを各直前に再確認する。WM_SETTEXT→WM_GETTEXTの完全一致、CreateNew添付intentの永続化・flush、再guard後のBM_CLICK1回だけを持ち、結果不明時の切替や再送をしない。OSfocus/key/mouse/認証操作は0。

Rootが05:21:07 JSTに設定・実読戻し一致、05:21:16にOpen1回を実行。新VID `VdD_3xdOGFQ` を05:23:03にnativeで確認し、asset票d487は不変のまま、別の `draft-binding-v07.json`（SHA `9736e2d1c74f731471395d1528c715ed67e7a34b48f70c296a8004b42a0ab89e`）へ凍結した。ここまで添付intent1、公開/予約Submit0。

## Metadataとcover入口

- `youtube142-metadata.ps1`: 不変のasset票とdraft票、同VID・本人・final file SHA・5alias/有限窓・pinned browserを毎fresh確認する。タイトルと説明の元値CASを行い、既定タイトルまたはfrozen値、既定説明SHAまたはfrozen値だけを標準ValuePatternで設定して完全一致を読む。外部編集は保持して停止。NoKidsの標準Selection、観測済みNext15976/ShowMore15974の標準Invokeのみで、公開/日時Submitは持たない。
- `youtube142-cover-select.ps1`: 同じ2票とexact metadata/NoKids、受入cover実SHAを照合し、観測した15924「ファイルをアップロード」で標準filepickerを開くだけ。必要な時は同一controlの標準ScrollIntoViewを使う。cover添付そのものと公開は行わない。

両方の実Parser errors0、実操作はRootのみ。Gaming希望値はnative読戻しまで未設定/未検証として扱う。添付の成功・metadataの成功・予約成立・実公開を区別する。

## Metadataの実確認とcover専用picker

Rootが05:31:33/43 JSTにタイトル・説明の完全読戻し一致、05:31:54にNoKids選択済み（変更0）を確認。05:32:31にcover upload15924を一回Invokeし、新しい画像用dialogを実probeした。Gamingはまだnative未確認。

`youtube142-cover-standard-picker.ps1` は、この別dialog90707982/PID49096/birth/Session/ownerchain、Edit192876156 ID1148、Open82905094 ID1に限定する。受入BGM ce39とcover 0d32、asset票・draft票、同VIDとタイトル/説明/NoKidsの実値を読み直す。親browserのfieldがmodalで無効でも、read-onlyの実値確認まで拒否しない。専用cover intentをCreateNewして一回だけOpenする。BGM添付のintentと混用しない。Parser errors0と静的review・実操作を区別し、Rootの添付結果が出るまで画像添付成功とは記録しない。

## Gaming・開示設問・公開設定

Rootがcoverの設定値・一回Openを確認し、本人windowのnative画像でも受入カバー「置く場所で、道が変わる。」を確認した。古いmetadata票のserverPreviewVerified=falseは当時の観測で、後の確認を否定する条件にはしない。

- `youtube142-category-control.ps1`: Rootの親子probeで区別したinner16684だけを開き、freshで観測したゲーム16759を最大一回Selectする。Rootが05:50:31 JSTにinner実Name「ゲーム」を確認した。
- `youtube142-disclosure-control.ps1`: 実際の限定的なAI開示設問と「いいえ、AI を使用していません」16148を照合する。現実の人物・出来事等を誤認させる編集やAI音楽という設問の対象に当たらないというRoot判断で、制作全体のAIツール不使用を意味しない。Rootの一回選択後、直後の読戻しは遅延で失敗し、別のread-only読取で05:52:46に選択済みを確認した。再選択なし。原本は一回Select後のfresh読取だけを最大6秒続ける形へ修正した。
- `youtube142-visibility-control.ps1`: 凍結metadata実確認票と同VID・現在titleを確認し、公開設定15932だけを選択する。Rootが05:53:05に選択を確認した。公開や予約のSubmitは持たない。

## 日時入力と予約未確定

`youtube142-datetime-control.ps1` は実観測した日付Edit17093（親17104「日付を入力」）と時刻Edit15835だけへ、元値CAS付きの標準ValuePattern.SetValueを一回行う。日付は2026/10/30→29、時刻は0:00→12:15。再送・キー入力・最終Submitはなく、入力値の完全読戻しと外側の日付buttonの実値を区別する。草案の自動変数 `$Host` との衝突は `$dateHost` へ直し、原本の本体実行前にParser errors0を確認した。Rootは別cloneで同じ修正を反映して実行した。

Rootの06:00:39の入力値は29でも外側日付buttonは30のままで、時刻の初回入力も日付再描画で0:00へ戻った。Rootの通常の対象controlへのfocusで日付29を反映し、時刻を改めて設定した。06:03:59のfresh native表示は日付29・12:15・GMT+0900だが、最終button16883のIsEnabled=falseを保持しており、予約Submitは0。画像の白いbuttonから有効と推測しない。プレミア公開の枠はnative画像で未チェックと目視したが、設定可能状態と予約成立は別に確認する。

この段階の未完了は、最終controlの実状態確認、別CreateNew intentによる一回の予約Submitとnative予約成立、公開可能になった後の同題Related接続である。
