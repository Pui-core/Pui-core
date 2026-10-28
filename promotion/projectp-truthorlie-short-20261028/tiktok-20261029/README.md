# 嘘か誠か v10：TikTok別窓の準備

管理 [144](https://github.com/Pui-core/-/issues/144) のSource準備のみ。RootがGUI・5alias lease・添付・公開の唯一の担当。writerはFirefox起動、GUI、lease変更、投稿を実行しない。

## 継承する完成動画

- F原本：`F:\Videos\ProjectP-TruthOrLie-Short-2026-10-28\model-motion-20261029\videos\truthorlie-real-v10-voice.mp4`
- SHA256：`e683ad00bad973a09456fd49895f8eddcde884be9c37f2ae5dca8bbaa4935592`
- 19.2秒、576f、1080×1920、声・効果音のみ。6句と実Round2通常点1の2人操作例を保持。
- NAS：`\\100.105.2.75\private\work\videos\2026-10-29\嘘か誠か\0513_投票と得点_実口パク_v10\声・効果音版.mp4`
- captionと技術QAは隣の `../model-motion-20261029/metadata/` と `../model-motion-20261029/qa/`。App Storeは https://apps.apple.com/jp/app/id6783599249 。正式Core/RMSによる16.8–19.2秒の72f実口パクと最終画像の確認を継承する。Rootの受入は技術・場面目視の範囲。全編直接試聴、ownerの創作採用、集客向上を確認済みにしない。

## Rootの有限な実行手順（この手順自体は未実行）

1. YouTube142の予約処理が完了してから、Rootが144の有限窓を事前宣言し、既存5aliasを同一run/owner/prop_pui/tiktokへ通常CASで取得する。既存のInterop接続確認を実施する。今回の既知identityはFirefox PID34828、Session1、birth `2026-10-27T17:54:34.0063169Z`。socket番号5291は参考値であり、再探索結果と同じ接続先を優先する。root環境やsocketを永続変更しない。
2. `source/read-own-window.ps1 -Action inventory -BoundRunId <現在のrun> -BoundExpiry <同じ期限> -BoundOwner <同じowner>` をRootの既存Interop経由で1回だけ実行し、返却HWND集合を私有tmpへ記録する。writerによる実観測は0。保護HWND69024は `FromHandle` を行わず、子のTab/Docも読まない。この窓の133（tab RID `42,69024,4,-68`）とYouTube142を変更しない。
3. Rootが確認済みの**同じFirefox実行ファイル**を使い、通常CLIの引数配列 `@('--new-window','https://www.tiktok.com/tiktokstudio/upload')` で1回だけ起動する。例示構文は `& $observedFirefoxExe '--new-window' 'https://www.tiktok.com/tiktokstudio/upload'`。実行ファイルのパスは直前の対象プロセスから確認し、推測しない。既存profileのcopy/指定、新instance、no-remote、private、debugger/Marionette、キー/マウスや強制focusを追加しない。
4. 起動後にinventoryを1回実行し、前回集合との差分が**可視の別窓1件**であることをRootが確認する。期待したPID/session/birthへ属さない、0件/複数件、既存69024内の新tabしかない場合は追従しない。CLIの正常終了は新窓・ログイン・本人account成功の証拠ではない。成否不明ならCLIを再送せず、読取から状態を調べる。
5. 新窓内で実観測した `hwnd`、選択Tabの`rid`、唯一の可視TikTok Studio Docの`rid`を、`-Action inspect -ExpectedWindowHandle <実値> -ExpectedTabRuntimeId <実値> -ExpectedDocumentRuntimeId <実値>` へ渡す。前項と同じBound引数が必須。新handle/RIDを予測しない。
6. inspectは公式upload address、exact本人プロフィールリンク、local最終SHAを確認する。**添付済み動画・native曲・権利・公開を確認するものではない**。新窓がログイン画面/別account/別URLなら停止する。profileや認証を抽出しない。原本と旧133を保全し、別の限定helperで次工程をRootが担当する。

Mozillaの[公式CLI仕様](https://firefox-source-docs.mozilla.org/browser/CommandLineParameters.html)では `--new-window <url>` はURLを別窓で開く指定。2026-10-29 JST取得。実機での別窓解決・同一account・成功はまだ検証していない。

## helperの作用範囲と制約

- actionはinventory/inspectのみ。読み取りAPIはWin32 `EnumWindows/IsWindowVisible/GetClassName/IsWindow/GetWindowThreadProcessId` と標準UIA `FromHandle/FindAll/GetRuntimeId/GetCurrentPattern` の状態読取だけ。UIAのSelect/Invoke/SetValue、focus、キー、マウス、認証、Firefox起動、ファイル保存の経路は無い。
- 既知PID/session/birthと保護HWNDは144用の固定条件。**新窓のhandle/RIDは引数のみ**。5alias・時刻窓（最大300秒、end>begin、now<end）を前後で再確認。処理の時計上限15秒、窓8件、型別control80件、native tab20件。同期UIA呼出しの内部停止は保証できないため、Rootの外側Interop timeoutも有限にする。timeout時は自動再試行しない。
- inventoryは非保護窓のTab/Doc RIDとStudio名への一致boolだけ。生の他タブ名・ページ本文・URL・captionを出力しない。inventoryだけでは本人account確認にならない。
- inspectは新窓とselected tabを固定し、表示名だけのowner判定や旧helperのown-marker例外を許可しない。nativeにexact `https://www.tiktok.com/@prop_pui` リンクが露出しなければ未確認として拒否する。根拠なく条件を弱めない。
- rawUI・実lease・認証・個人声・SDK/MOCはGitへ入れない。実観測結果はRootの私有tmpへ。Gitへ残す結果は必要最小の非秘密要約だけ。

Source検査の記録は `qa/validation.json`。Windows PowerShellのParserで構文エラー0、抽出した固定C#型はcompile成功（native関数の呼出0）。`source/check-readonly.ps1` はSourceを実行せずAST/importを列挙する検査用。今回この検査PS1の直接実行は既存の署名policyで拒否されたため、policyを変更せず明示的なParser呼出とC#compileだけ実施した。helperの実UIA/lease読取や別窓起動は未実施。

## 次工程に残る実確認

TikTokネイティブ曲の日本向け商用アプリ宣伝可否、実sound ID/曲/開始位置/音量、150BPM想定gridへの実音はめ、6句全体の聴感・captionのnative持続・投稿設定は未確認。旧Digital Horizonや132の試聴回答を流用しない。150BPMは0.4秒gridという既存編集条件であり、曲選択の証明ではない。

このSource PRのmergeは読取helper・手順の完了のみ。管理144の実投稿、receipt、24h/72h分析予定が揃うまではIssueを完了にしない。Rootは公開直前のfrozen asset/caption/native曲/設定/本人accountを再確認し、`CreateNew`一回intent→native投稿一度→ID/実時刻/音源/リンク読戻しを別工程で行う。
