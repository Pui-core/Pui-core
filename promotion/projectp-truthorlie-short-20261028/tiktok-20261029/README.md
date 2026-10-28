# 嘘か誠か v10：TikTok別窓の準備

管理 [144](https://github.com/Pui-core/-/issues/144) のSource準備のみ。RootがGUI・5alias lease・添付・公開の唯一の担当。writerはFirefox起動、GUI、lease変更、投稿を実行しない。

## 継承する完成動画

- F原本：`F:\Videos\ProjectP-TruthOrLie-Short-2026-10-28\model-motion-20261029\videos\truthorlie-real-v10-voice.mp4`
- SHA256：`e683ad00bad973a09456fd49895f8eddcde884be9c37f2ae5dca8bbaa4935592`
- 19.2秒、576f、1080×1920、声・効果音のみ。6句と実Round2通常点1の2人操作例を保持。
- NAS：`\\100.105.2.75\private\work\videos\2026-10-29\嘘か誠か\0513_投票と得点_実口パク_v10\声・効果音版.mp4`
- captionと技術QAは隣の `../model-motion-20261029/metadata/` と `../model-motion-20261029/qa/`。App Storeは https://apps.apple.com/jp/app/id6783599249 。正式Core/RMSによる16.8–19.2秒の72f実口パクと最終画像の確認を継承する。Rootの受入は技術・場面目視の範囲。全編直接試聴、ownerの創作採用、集客向上を確認済みにしない。

## Rootの有限な実行手順（PR76初稿・以後の実測は末尾）

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

PR76時点のwriter検査記録は `qa/validation.json`。Windows PowerShellのParserで構文エラー0、抽出した固定C#型はcompile成功（native関数の呼出0）。`source/check-readonly.ps1` はSourceを実行せずAST/importを列挙する検査用。この検査PS1の直接実行は既存の署名policyで拒否されたため、policyを変更せず明示的なParser呼出とC#compileだけ実施した。writerはhelperの実UIA/lease読取や別窓起動を実施していない。

## 次工程に残る実確認

TikTokネイティブ曲の日本向け商用アプリ宣伝可否、実sound ID/曲/開始位置/音量、150BPM想定gridへの実音はめ、6句全体の聴感・captionのnative持続・投稿設定は未確認。旧Digital Horizonや132の試聴回答を流用しない。150BPMは0.4秒gridという既存編集条件であり、曲選択の証明ではない。

このSource PRのmergeは読取helper・手順の完了のみ。管理144の実投稿、receipt、24h/72h分析予定が揃うまではIssueを完了にしない。Rootは公開直前のfrozen asset/caption/native曲/設定/本人accountを再確認し、`CreateNew`一回intent→native投稿一度→ID/実時刻/音源/リンク読戻しを別工程で行う。

## 10月29日06時台：Rootの新窓実測

`qa/new-window-20261029.json` は、Rootの通常CLI一回と新窓/Docの実測を、rawUI・lease・認証を複製せず要約した記録。Root実行の `source/open-new-window-root.ps1` はSHA `ec7049a93ce88dde846c943c10cc5460587c829adfb8c7318e8f891f9d7c5845` のまま保存した実行済みSourceであり、再実行用の汎用helperではない。元の読取helper `read-own-window.ps1` のSHA `afe36ec84cef6ff318a39b30e99fca2e906ee8f00b62be2d9ff524d23328525d` は不変。

Rootが06:21:55 JSTに通常CLIを1回起動し、新HWND51187480、selected tab `42,51187480,4,-17035`、可視Doc `42,51187480,4,-18262` を実観測した。旧69024の子UIは読まない。06:22:33のinspectは公式upload URLの後、exact本人hrefが見つからず停止し、その時点では本人accountが未確認だった。窓作成だけからログイン/添付/音源/投稿の成功を推定しなかった。

06:25:23にRootが観測済みavatarへ標準ExpandCollapseのExpandを行い、本人のexactプロフィールhrefを露出させた。06:25:31に不変のstrict helperによるinspectが成功。writerは非秘密の既存確認票のSHA・本人account・新窓/tab/Doc・local asset SHAを読取確認した。未露出markerの例外は追加していない。

## 新窓だけのnative読取とカタログ移動

`source/native-music144.ps1` は上記の実観測済み新窓/tab/Docへ固定したBOM付きPS1。Rootだけが使う。`readUpload` はfreshなexact本人href・official upload address・v10 SHAを要求して現在のcontrol metadataを読む。`musicNav` は加えて実観測ボタン `42,51187480,4,-18284`、完全名「ロイヤリティフリーの楽曲」・Enabled・Invoke可能を照合し、私有`CreateNew`ナビ意図票→全条件再確認→Invoke一度だけ。添付・保存・最終投稿・focus・キー・マウスの経路はない。

RootはSHA `c98ee455ae1645908f9b753420aa1589ccf1f4510027fbac69bb6a4ad15b567d` のhelperで06:29:52にmusicNavを一度実行した。直前の本人確認はtrue、返却時のcatalogVerifiedはfalse。直後のRoot inventoryでは同じ新窓/tab/Docが見えており、旧69024は子読取0。ナビ要求をカタログの表示成功や音源権利確認へ読み替えない。

`readCatalog` だけはRootが実観測した `-ExpectedCatalogDocumentRuntimeId` を必須とし、同じ新窓/tab、official sound-library addressと完全一致headerを確認して公開楽曲カタログを読む。profile menuが閉じて本人hrefが出なければ`ownAccountVerified=false`で返し、アップロード操作へは使わない。readCatalogからInvokeする経路はない。曲ID・JP商用可否・拍・開始位置は実表示で別途確認する。生UI出力は私有tmpに保持し、Gitには選択した非秘密結果だけ残す。

新helperはWindows Parserエラー0、固定C#読取型compile成功、writerのnative呼出0。独立補助が同SHA全文を静的確認して必須指摘なし。実音源や聴感を確認済みとはしていない。検証の範囲は `qa/native-music-validation.json` を参照。

Rootの06:30:12のカタログ読取はofficial sound-library、同じ実測Doc、見出しを確認して成功した。本人hrefは閉じており`ownAccountVerified=false`の公開catalog読取として記録。一般的な利用制限に関するnative文言が見えたことだけで、日本向け商用アプリ宣伝の適合やBPMを確定していない。

追加の `source/catalog-rows144.ps1` はGroup/DataItem/Hyperlinkと親RIDを含む限定reader。public music URLだけを出力し、曲の行と無名buttonの対応をRootが読める。`scrollCatalog` だけは観測済み曲Tab18703へのScrollItem一回で、pattern未対応なら停止する。曲採用や投稿のInvokeは持たない。カタログheaderがmodalで隠れていれば停止する。

Rootが「使い方」を開くとページheaderが隠れたため、別の `source/usage-modal144.ps1` を用意した。`readUsage` 一種類だけ、観測済みtitle18497/OK18502の完全名・可視を確認し、same newwindow/tab/Docとofficial sound-library・5alias・assetのguardを維持する。Group/Image/Paneのmetadataまで読むが、OKのInvokeやscrollも持たない。このmodal限定の読取条件をuploadやmedia操作へ転用しない。検査は `qa/catalog-readers-validation.json` 。ライセンスの本文やJP範囲は実表示の確認待ち。

writerはRoot CLIの既存Sourceとmetadata-onlyのbefore票のSHA一致、私有intentの必要な非秘密fieldsだけを読取確認した。新窓のlive UIA/lease/起動はRoot専管。Rootの実観測をwriter自身のGUI実行済みと扱わない。

## 第3段階：標準ファイルダイアログ

SourceのPRとLinux worktreeを今回の実工程の区切りまでDraftで保持する。準備だけで小分けのmerge/削除を繰り返さない。Rootが通常のアップロード導線へ戻るとサーバーが`from`/`tab`を付けたため、公式https/www host/pathは固定したまま、queryキー2件以内をこの2種類に限定する。query値・認証は記録しない。Rootのheader/選択helperのSourceは`source/root-*.ps1`に保存。

Rootは06:46:58に新窓のexact本人hrefを確認し、実測の動画選択ボタン18574を一度Invokeした。新窓をownerとする標準#32770（62789604/PID48244/Session1）を06:52:18のprobeで確認。Edit1148とOpen1、filename hostはnativeに存在するが、UIAでは全てPaneでValue/Invoke Patternが無かった。旧69024の子UIやフォルダー一覧は読んでいない。詳細は`qa/filepicker144.json`。

`source/filepicker-probe144.ps1`は凍結own-before ticket、asset、新窓/tab/Docとofficial upload originを結び、標準ダイアログのowner chain・PID/session/birthと標準控件のmetadataだけを読む。ファイル名の値やディレクトリ内容、入力経路はない。

Rootが標準Win32メッセージによる制御を明示選択したため、`source/filepicker-control144.ps1`は同じticketと実probeのSHA、実測dialog/控件/親class・ID・所有・可視有効・ES_READONLY=0へ固定する。`read`はWM_GETTEXTの結果をempty/desired/otherに分類し全文を返さない。`set`はempty時だけWM_SETTEXT一回、desired時は再設定せず、完全readbackを確認。otherは上書きしない。`open`はdesiredとfresh guard、CreateNewの一回添付意図票、再確認の後BM_CLICKを一回送る。各メッセージは2秒のSendMessageTimeoutWで送り、focus/global input/公開の経路は持たない。送信とアップロード成功は別で、Rootのnative読戻しが必要。

writerはprobe/controlのWindows Parserと固定C# compileだけを実行し、native呼出・GUI・lease・ファイル入力は0。本人確認ticketに任意の短い失効を追加しておらず、同じ所有modalの継続中でも、期限切れのlease窓では操作しない。音源のJP商用範囲・実選曲と投稿は引き続き未完了。

Rootが06:57にread→set一回と完全readback→Openメッセージ一回を実行し、06:59:03のnative画面でv10ファイル名と5.8MBアップロード完了を確認した。ローカルSHAと凍結dialogの送信・native表示を対応付ける証跡であり、プラットフォーム再encode後のbyte同一性を検証したものではない。再添付やOpen再送はしない。

`source/open-native-music144.ps1` はアップロード済みticket aa27とnative filename/completeを照合し、Rootの実測した楽曲ボタン11499だけを標準ScrollItemで表示→fresh本人リンク/asset確認→CreateNew意図→再確認→Invoke一度で開く。`read` は作用0。profileの標準Expandは必要時最大2回で、OS focus/global input、曲採用、再アップロード、公開経路はない。caption修復は別工程なので、このprivate editor移動へcaption一致gateを追加しない。音源のJP範囲や選曲を確認済みとはしない。

captionでは最初のValuePattern設定が元のstemへ追記され、TextRange全選択だけでも非同期反映後の再設定が追記となった。失敗を削除せず時点別に記録した。Rootがfresh本人確認→captionへの通常UIA SetFocusとHasKeyboardFocus確認→全選択→反映の読取poll→SetValue一回に変え、07:12:06の別読取で修復を確認した。DocRangeはticket全文174字＋末尾LF一個と一致し、ValuePatternは改行を空白へ変えて末尾改行を除いた173字で一致。stem/重複なし。ValuePatternのbyte完全一致とは呼ばず、この正規化条件を明示する。clipboard/global key/mouse/OS強制focusは使っていない。Rootの修復Sourceと最終確認SHAを保存。

Rootは07:12:08にnative楽曲エディターを一度開き、フィルターの「商用利用」を実観測した。ラベルがあることと、フィルター適用・JP範囲・実選曲を確定したことは分ける。Source/PRとworktreeは編集工程の区切りまで引き続き保持する。
