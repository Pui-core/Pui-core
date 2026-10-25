# プロフィール保存クリックの構造体修正

管理 [#98](https://github.com/Pui-core/-/issues/98)。ProjectPのプロフィール変更はowner承認済みですが、実画面操作はrootの単独担当だけが行います。このフォルダーの制作担当は入力・カーソル移動・focus変更を実施していません。

## 原因とmemory検査

旧実装は、PowerShellでネストしたvalue型へ `$down.mouse.flags=2` / `$up.mouse.flags=4` と代入していました。親structへ値が残らず、実際の40byteへのMarshal結果は両方ともflags0でした。旧APIが2件を受理した事実は保持しますが、クリックbitがないイベントの受理をクリックの証明にはできません。

新helperはC#側でMouse structを作り、Inputの親fieldへ明示代入した配列を返します。[MicrosoftのMOUSEINPUT定義](https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-mouseinput)のLEFTDOWN=2・LEFTUP=4を、Marshalしたbytesで検査してから実行branchへ進みます。x64だけを対象とし、[INPUT](https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-input)はtype0・size40・dwFlags offset20です。[SendInput](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput)には、その検証済み2イベントを一度だけ渡します。

- `original-memory-observation.json`: rootの旧コード再現観測。OS入力なし。
- `Test-ClickStruct.ps1`: 旧代入と修正factoryを同じ型/layoutでMarshalする回帰検査。
- `memory-regression.json`: 実Windows x64で旧0/0、修正2/4、type0、size40、offset20、input/cursor呼出0を確認。
- `Invoke-BioClick.ps1`: 引数なしはmemory検査だけで終了します。defaultでFirefox参照やuser32 APIも呼びません。

## root専用の実行条件

`-Execute` がない限り入力しません。実行には、現在のFirefoxのPID・Windows session・UTC開始時刻・HWND・前景一致と、freshなSaveボタンのscreen-pixel rectangleを要求します。PID名がfirefox、現在のwindow titleにTikTokが含まれることも照合します。helperが前景化することはありません。

```powershell
# 既定は非操作。全40bytesとflags2/4を確認するだけ。
.\Invoke-BioClick.ps1
.\Test-ClickStruct.ps1 -OutputFile .\memory-regression.json

# 以下のplaceholderを現在の実測値で埋めるのはrootだけ。
.\Invoke-BioClick.ps1 -Execute `
  -ExpectedPid <FirefoxPID> -ExpectedSession <WindowsSession> `
  -ExpectedStart '<UTC-roundtrip-start>' -ExpectedHwnd <HWND> `
  -X <SaveCenterX> -Y <SaveCenterY> -TargetRect 'x,y,width,height'
```

日時・rect・点が不正、点がrect外、rectが対象window外、identity/session/foreground不一致なら入力を拒否します。カーソル移動後にもidentity/foregroundを再照合します。SendInputの返却が2でなければpartial/unknownとして失敗し、自動再試行は行いません。2を返してもBIO永続保存の証明ではありません。

実行結果の `focusChangedByHelper=false` は、helperが前景化やfocus設定APIを呼ばない意味です。通常のクリックによるページ内のfocus変化まで否定する測定値ではありません。

## native受入は別条件

rootは現account `prop_pui` とlease/公開receiptを確認し、DESKTOP-001告知、fresh modalへのkeyboard入力、期待62文字/counter、blur、最新Save rectと有効状態の確認後にだけ使用します。本Issueの実保存は最大1回。保存後のreload・自己紹介・可能なら通常public signatureで永続反映を確認し、結果を追記します。

旧#96の2/2保存intentと観測は変更しません。この新しい原因に対する1回の修正検証を、古い試行budgetのリセットや一般的なretry許可とは扱いません。

## rootのnative受入結果

2026-10-25 13:01:31.873 UTC、正しいflags2/4を用いた保存をrootが1回だけ実行し、2イベント受理・modal終了を確認しました。直後は旧プロフィールcacheが見えましたが、手動reload後に希望62文字の自己紹介が残り、本人account `prop_pui`・表示名 `Project_P ぷぃ` は維持されました。保存後の自己紹介を2026-10-25 13:04:55 UTCに記録しています。

- `native-result.json`: native保存とreload後永続反映、旧2/2intent保持、新保存1/1、再投稿なしを、rootの元証跡SHAへ対応付けた非秘密記録。
- `native-click-receipt.json`: rectと62文字照合・検証済みflags2/4・入力受理2件・自動retryなし。入力受理と永続反映は別の証跡です。
- `public-observation.json`: 通常の匿名public取得はHTTP200でしたが、profile metadataを取得できず、独立public signatureは**未確認**。native reloadの成功をpublic metadata検証済みに読み替えません。

本修正のmemory回帰とnative BIO永続反映はPASSです。制作担当自身は入力せず、モデル動画・配信設定・runtimeを変更していません。フォロワー目標や日次運用全体の完了を意味せず、親#93は継続します。
