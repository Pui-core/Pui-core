# #134 当日の公開支援スクリプト

2026-10-28、Rootが本人のYouTube Studioで作成した新しいアップロード下書きに対して使った運用原本。動画はv9のBGM版、IDは `2KGUzjEmfwg`。制作担当はスクリプト生成のみを行い、実parse・画面操作・lease管理・アップロード・公開はRootが専管する。生のUI一覧、旧チャンネル説明、lease内容、認証情報はここへ保存しない。

- `youtube134-filepicker-probe.ps1`: 本人Firefox配下か正規owner chainのファイルダイアログだけを調べる。ファイル名Edit1148とOpen ID1以外の内容・ディレクトリ一覧を取得しない。入力0。
- `youtube134-filepicker-set-open.ps1`: Rootのfresh probeで得たダイアログ/プロセスbirth/入力欄/ボタンへpin。最終動画の実SHAを照合し、通常の前面化が成立した場合に限り、標準ValuePatternまたはWM_SETTEXTでファイル名を設定し実読戻しを確認する。Open前にCreateNewで添付intentを保存し、Openは1回。既存intentや対象不一致なら繰り返さない。RootはPSparse0、実読戻し一致とOpen1回を確認した。
- `youtube134-metadata.ps1`: frozen preparedの実SHAと動画の実SHA、今回の動画ID、本人チャンネル、選択タブ、PID/Session/birth/HWND、5aliasと告知期間を照合する。タイトルと説明はfrozen値だけを設定して完全一致を読み戻す。「子ども向けではない」は選択状態を確認し必要な時だけ標準Selectionを行う。ナビゲーションはfresh RuntimeID/Nameへ固定し、「次へ」「初期チェック」「チェック」「公開設定」だけを許す。公開・保存・完了ボタンを操作する経路はない。

これらは当日のhard pinを持つ証跡用コピーで、汎用ランチャーではない。将来の別window・別process・別動画へ旧PID/HWND等を流用しない。実際の公開担当が当該時点の観測と所有を確認し、元の稼働中スクリプトやleaseを制作担当が変更しない。metadataの実parse/実設定・最終公開はRootの別記録と照合する。
