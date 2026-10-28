param([ValidateSet('read','selectFile')][string]$Action='read',[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry)
$Service='youtube'
$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName UIAutomationClient;Add-Type -AssemblyName UIAutomationTypes
$leasePaths=@('\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-youtube-ai128-20261027\claim.json','\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-youtube-20261026\claim.json','\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-truthorlie-quality129-20261027\claim.json','\\wsl.localhost\Ubuntu\home\pui\.claude\projectp-tiktok\publisher-nomination.json','\\wsl.localhost\Ubuntu\home\pui\.claude\projectp-tiktok\browser-lease.json')
function Guard {
 $now=[DateTime]::UtcNow
 if($Service -ne 'youtube' -or $now -ge [DateTimeOffset]::Parse($BoundExpiry).UtcDateTime.AddSeconds(-25)){throw 'Service/window margin refused'}
 foreach($f in $leasePaths){$l=Get-Content -LiteralPath $f -Raw -Encoding UTF8|ConvertFrom-Json
  if($l.runId -cne $BoundRunId -or $l.expiresAt -cne $BoundExpiry -or $l.state -ne 'held' -or $l.currentService -ne 'youtube' -or $l.owner -ne 'root-quality129-old-reservations' -or $l.accountId -ne 'UCZsCpCNJ-BBKEv7EMz1P73Q'){throw 'Publisher lease changed'}
  $begin=[DateTimeOffset]::Parse($l.announcedWindow.startJst).UtcDateTime;$end=[DateTimeOffset]::Parse($l.announcedWindow.endJst).UtcDateTime
  if($now -lt $begin -or $now -ge $end -or $end -le $begin -or $end -gt [DateTimeOffset]::Parse($BoundExpiry).UtcDateTime -or ($end-$begin).TotalSeconds -gt 300){throw 'Announced window mismatch'}
 }
}
Guard
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Pp142FileSelect{[DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'
$p=Get-Process -Id 34828;[uint32]$wpid=0
if(-not [Pp142FileSelect]::IsWindow([IntPtr]69024)){throw 'Pinned window missing'}
[void][Pp142FileSelect]::GetWindowThreadProcessId([IntPtr]69024,[ref]$wpid)
if($wpid -ne 34828 -or $p.SessionId -ne 1 -or [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1 -or $p.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Pinned browser identity changed'}
$r=[System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]69024)
$tabs=$r.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty,[System.Windows.Automation.ControlType]::TabItem))
$tab=@($tabs|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-1253' -and $_.Current.Name -match 'YouTube Studio$'})
if($tab.Count -ne 1 -or -not $tab[0].GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Pinned YouTube tab not selected'}
$docs=$r.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty,[System.Windows.Automation.ControlType]::Document))
$doc=@($docs|Where-Object{$_.Current.Name -match 'YouTube Studio$'})
if($doc.Count -ne 1){throw 'Unique YouTube Studio doc required'}
$els=$doc[0].FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.Condition]::TrueCondition)
$own=@($els|Where-Object{try{$_.Current.ControlType -eq [System.Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value -ceq 'https://studio.youtube.com/channel/UCZsCpCNJ-BBKEv7EMz1P73Q'}catch{$false}})
if($own.Count -lt 1){throw 'Own channel marker absent'}


function RefreshUploadStage {
 Guard
 $bp=Get-Process -Id 34828;[uint32]$again=0
 if(-not [Pp142FileSelect]::IsWindow([IntPtr]69024)){throw 'Pinned browser window absent'}
 [void][Pp142FileSelect]::GetWindowThreadProcessId([IntPtr]69024,[ref]$again)
 if($again -ne 34828 -or $bp.SessionId -ne 1 -or [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1 -or $bp.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Pinned browser identity changed'}
 $tabsNow=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::TabItem))
 $selected=@($tabsNow|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-1253' -and $_.Current.Name -match 'YouTube Studio$'})
 if($selected.Count -ne 1 -or -not $selected[0].GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Pinned YouTube tab not selected'}
 $docsNow=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Document))
 $docNow=@($docsNow|Where-Object{$_.Current.Name -match 'YouTube Studio$'})
 if($docNow.Count -ne 1){throw 'Unique YouTube Studio document required'}
 $script:els=$docNow[0].FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition)
 $ownNow=@($els|Where-Object{try{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -ceq 'https://studio.youtube.com/channel/UCZsCpCNJ-BBKEv7EMz1P73Q'}catch{$false}})
 if($ownNow.Count -lt 1){throw 'Own UC marker absent in fresh document'}
 $script:completion=@($els|Where-Object{$_.Current.Name -ceq '動画の公開日時' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Pane -and -not $_.Current.IsOffscreen})
 $script:fileSelect=@($els|Where-Object{$_.Current.Name -ceq 'ファイルを選択' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Button -and -not $_.Current.IsOffscreen})
 $script:existingTitle=@($els|Where-Object{$_.Current.Name -ceq '動画について説明するタイトルを追加（@ を使用して、チャンネルをメンションできます）' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Edit -and -not $_.Current.IsOffscreen})
 $script:existingSteps=@($els|Where-Object{$_.Current.ControlType -eq [Windows.Automation.ControlType]::TabItem -and $_.Current.Name -cin @('詳細','動画の要素','初期チェック','公開設定') -and -not $_.Current.IsOffscreen})
 $script:create=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-9837' -and $_.Current.Name -ceq '作成' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Button -and $_.Current.IsEnabled -and -not $_.Current.IsOffscreen})
 $script:upload=@($els|Where-Object{$_.Current.Name -ceq '動画をアップロード' -and $_.Current.ControlType -in @([Windows.Automation.ControlType]::Button,[Windows.Automation.ControlType]::MenuItem) -and $_.Current.IsEnabled -and -not $_.Current.IsOffscreen})
}
$PreparedPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261029\youtube142-prepared.json'

# Root accepted Issue141 v07; exact asset and prepared frozen below.
$AcceptedRevision='v07'
$AcceptedSourceIssue=141
$PreparedSha256='d487b218626f916c1ca281fa7f58fc306ff5bcdd8d657bc846af3b244aee3fec'
$AcceptedVideoFile='F:\Videos\ProjectP-EMBERWAKE-Longform-2026-10-28\demo07-natural\videos\emberwake-v07-bgm.mp4'
$AcceptedVideoSha256='ce39d1223e7a9dfc59488b9c828f5c44bac363fd59334484f519f5dbbdef7241'
function AcceptedV07 {
 if($AcceptedRevision -cne 'v07' -or $AcceptedSourceIssue -ne 141 -or $PreparedSha256 -notmatch '^[0-9a-f]{64}$' -or $AcceptedVideoSha256 -notmatch '^[0-9a-f]{64}$' -or [string]::IsNullOrWhiteSpace($AcceptedVideoFile)){throw 'Root-accepted Issue141 v07 exact asset/prepared binding is not configured; no file selection'}
 if((Get-FileHash -LiteralPath $PreparedPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $PreparedSha256){throw 'Frozen 142 prepared changed'}
 $p=Get-Content -LiteralPath $PreparedPath -Raw -Encoding UTF8|ConvertFrom-Json
 if($p.issue -ne 142 -or $p.productionIssue -ne 141 -or $p.acceptedRevision -cne 'v07' -or $p.rootMediaAccepted -ne $true -or $p.rootMediaAcceptanceUrl -cne 'https://github.com/Pui-core/-/issues/141#issuecomment-6479380594' -or $p.channelId -cne 'UCZsCpCNJ-BBKEv7EMz1P73Q' -or $p.file -cne $AcceptedVideoFile -or $p.videoSha256 -cne $AcceptedVideoSha256){throw 'Prepared issue/account/accepted asset mismatch'}
 if((Get-FileHash -LiteralPath $AcceptedVideoFile -Algorithm SHA256).Hash.ToLowerInvariant() -cne $AcceptedVideoSha256){throw 'Accepted v07 video changed'}
}
function Empty142Modal {
 RefreshUploadStage
 if($completion.Count -gt 0 -or $existingTitle.Count -gt 0 -or $existingSteps.Count -gt 0){throw 'Existing completion/draft preserved'}
 $header=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-15771' -and $_.Current.Name -ceq '動画のアップロード' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Text -and -not $_.Current.IsOffscreen})
 $script:choose=@($fileSelect|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-15859' -and $_.Current.IsEnabled})
 if($header.Count -ne 1 -or $choose.Count -ne 1){throw 'Unique observed empty upload header/file-select control required'}
}
Empty142Modal
if($Action -eq 'read'){
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='read';emptyUploadModalMatched=$true;fileSelectRuntimeId='42,69024,4,-15859';fileSelectName='ファイルを選択';acceptedV07Configured=($AcceptedRevision -ceq 'v07' -and $AcceptedSourceIssue -eq 141 -and $PreparedSha256 -match '^[0-9a-f]{64}$' -and $AcceptedVideoSha256 -match '^[0-9a-f]{64}$');fileSelectionActions=0;fileAttachIntents=0;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0}|ConvertTo-Json -Compress;exit
}
if($Action -ne 'selectFile'){throw 'Only read or accepted-v07 file-select dialog opening is allowed'}
AcceptedV07;Empty142Modal;AcceptedV07;Guard
$choose[0].GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='selectFile';runtimeId='42,69024,4,-15859';invokeSentOnce=$true;acceptedVideoSha256=$AcceptedVideoSha256;fileSelectionActions=1;fileAttachIntents=0;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0;status='inspect-owned-standard-filepicker-no-file-attachment-yet'}|ConvertTo-Json -Compress
