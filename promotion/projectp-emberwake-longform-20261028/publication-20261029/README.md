# #142 モデル反映版長尺の予約準備

[管理Issue #142](https://github.com/Pui-core/-/issues/142)。141の正式Revenant_Natural Core/RMSを使ったv07の受入後に、本人YouTubeへ1回だけアップロードし、2026-10-29 12:15 JSTの予約を第一候補とする。旧v06を代わりに添付・公開しない。GUI・lease・投稿はRoot専管で、制作担当はhelperと非秘密証跡をこのディレクトリだけに保存する。

現在は141 v07の最終動画・prepared・SHA受入と凍結が完了し、新videoIDはまだ未発行。ファイル選択・添付・公開は0。予約候補は最適時刻の実証ではない。

- `youtube142-entry-control.ps1`: readと公開済み134の完了paneを閉じる操作だけ。本人channel・選択YouTubeタブ・ブラウザーPID/Session/birth/HWND・5alias/有限窓・134のpublic canonicalを確認し、pane14614内のshare14701/公開日と、Rootがfresh観測した下の閉じる14713だけを再確認する。Rootが04:51:51 JSTに標準Invoke1回を実施。上の閉じる14640や他の画面は操作しない。
- `youtube142-upload-stage.ps1`: read、作成9837、fresh RuntimeID/Nameの「動画をアップロード」menu/buttonだけ。本人と所有・期間を各回確認し、既存の完了pane・空upload modal・title edit・upload段階タブがあれば追加openを拒否して保全する。「ファイルを選択」や添付・最終Submitの経路はない。

両方ともUTF-8 BOM。標準UIA Invokeだけを使用し、OS focus、グローバルキー・マウス、認証処理、任意の低レベル入力fallbackを持たない。実parse・実操作はRootが行い、未実行を動作済みと扱わない。[現在の記録](progress.json) にsource baseとscript SHA、sanitized実結果、未確定を記録する。raw UI、lease内容、SDK/MOC、動画本体をGitへ入れない。

最終asset/prepared/SHAは下段のとおり凍結済み。今後は新videoIDを凍結し、所有filepicker・metadata/credit・NoKids・native checks・予約日時を実値で照合する。添付と最終Submitは別のCreateNew一回intentを置き、不明な結果を再送しない。同題Short111のRelatedは新長尺がpublic/unlistedで利用可能になってから確認し、別物語の旧114/117へ差し替えない。

## v07受入とファイル選択の準備

Rootが141のv07を受け入れ、`prepared-v07.json` を凍結した。prepared SHAは `d487b218626f916c1ca281fa7f58fc306ff5bcdd8d657bc846af3b244aee3fec`、BGM動画SHAは `ce39d1223e7a9dfc59488b9c828f5c44bac363fd59334484f519f5dbbdef7241`。制作Issue141・acceptedRevision v07・rootMediaAccepted・Root受入URLも検査し、ファイル名から版を推測しない。Rootは作成とアップロードmenuを各1回Invokeして空modalを確認した。まだ142のファイル選択・添付・Submitは0。

- `youtube142-file-select.ps1`: 受入済みv07とpreparedの実SHA、本人・有限窓・空modal/header15771/fileSelect15859を照合し、標準Invokeでfilepickerを開くだけ。ファイル添付はしない。
- `youtube142-filepicker-probe.ps1`: read-only。正規ownerchainの標準filepickerと同Sessionを照合し、ファイル名Edit1148とOpen1のみを調べる。ファイル名host親3段は型/ID/対応UIA patternだけを出し、ディレクトリ一覧や他窓内容を収集しない。入力の自動fallbackを持たない。

未実行のprobe草案にJSの置換文字列内の `$'` 展開による本文重複があり、独立静的reviewで検出した。旧草案は実行せず、callbackでliteral挿入して再生成。tab/doc条件各1行・本文1回を確認し、2本とも実PowerShell `Parser.ParseFile` のerrors0を確認した（helper本体は実行していない）。修正版SHAをRootへ渡し、独立reviewでも旧指摘解除・新たな重大指摘なし。記録は `syntax-frozen-v07.json` と `progress.json`。
