# #134 当日の公開支援スクリプト

2026-10-28、Rootが本人のYouTube Studioで作成した新しいアップロード下書きに対して使った運用原本。動画はv9のBGM版、IDは `2KGUzjEmfwg`。制作担当はスクリプト生成のみを行い、実parse・画面操作・lease管理・アップロード・公開はRootが専管する。生のUI一覧、旧チャンネル説明、lease内容、認証情報はここへ保存しない。

- `youtube134-filepicker-probe.ps1`: 本人Firefox配下か正規owner chainのファイルダイアログだけを調べる。ファイル名Edit1148とOpen ID1以外の内容・ディレクトリ一覧を取得しない。入力0。
- `youtube134-filepicker-set-open.ps1`: Rootのfresh probeで得たダイアログ/プロセスbirth/入力欄/ボタンへpin。最終動画の実SHAを照合し、通常の前面化が成立した場合に限り、標準ValuePatternまたはWM_SETTEXTでファイル名を設定し実読戻しを確認する。Open前にCreateNewで添付intentを保存し、Openは1回。既存intentや対象不一致なら繰り返さない。RootはPSparse0、実読戻し一致とOpen1回を確認した。
- `youtube134-metadata.ps1`: frozen preparedの実SHAと動画の実SHA、今回の動画ID、本人チャンネル、選択タブ、PID/Session/birth/HWND、5aliasと告知期間を照合する。タイトルと説明はfrozen値だけを設定して完全一致を読み戻す。「子ども向けではない」は選択状態を確認し必要な時だけ標準Selectionを行う。ナビゲーションはfresh RuntimeID/Nameへ固定し、「次へ」「初期チェック」「チェック」「公開設定」だけを許す。公開・保存・完了ボタンを操作する経路はない。
- `youtube134-description-control-v2.ps1`: Root作成の別原本。外部で追加されたタイトルのタグを保持したv2へ凍結し、説明の既存値のSHAとfrozen値を比較してから標準ValuePatternだけで設定する。OSの前面化・キー・マウスを使わず、実読戻し一致をRootが確認した。v1原本を上書きしていない。
- `youtube134-visibility-control.ps1`: v2タイトル・説明・NoKidsの完全一致を確認して、観測した「公開設定」タブだけを標準SelectionItemで選ぶ。Rootが14:42:41Zに実行し、3条件と選択後の実読戻しを確認。
- `youtube134-publication-control.ps1`: ハッシュ固定した上記実preflight、v2と動画SHA、本人・期間・動画ID・タイトル、予約なし、公開選択、両チェック完了を再照合する。readと公開radio選択は公開を行わず、publishだけがCreateNewの一回限定intent後に固定「公開」buttonをInvokeする。Rootが14:50:18Zに一回実行し、公開完了表示と公式匿名公開を確認した。静的reviewと実行結果を混同しない。

これらは当日のhard pinを持つ証跡用コピーで、汎用ランチャーではない。将来の別window・別process・別動画へ旧PID/HWND等を流用しない。実際の公開担当が当該時点の観測と所有を確認し、元の稼働中スクリプトやleaseを制作担当が変更しない。公開後のF最終MP4削除とlease解放により、当日helperのガードが停止するのは正常。実行結果・公開URL・クレジットは [公開証跡](../../qa/v9/youtube-publication.json) を参照する。
