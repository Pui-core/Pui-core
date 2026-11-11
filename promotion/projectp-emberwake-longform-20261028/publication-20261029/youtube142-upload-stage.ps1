param([ValidateSet('read','create','openUpload')][string]$Action='read',[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry,[string]$ExpectedRuntimeId='',[string]$ExpectedName='')
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
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Pp142UploadStage{[DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'
$p=Get-Process -Id 34828;[uint32]$wpid=0
if(-not [Pp142UploadStage]::IsWindow([IntPtr]69024)){throw 'Pinned window missing'}
[void][Pp142UploadStage]::GetWindowThreadProcessId([IntPtr]69024,[ref]$wpid)
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
 if(-not [Pp142UploadStage]::IsWindow([IntPtr]69024)){throw 'Pinned browser window absent'}
 [void][Pp142UploadStage]::GetWindowThreadProcessId([IntPtr]69024,[ref]$again)
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
function NoExistingUpload {
 if($completion.Count -gt 0){throw 'Public completion pane still visible; preserve it'}
 if($fileSelect.Count -gt 0 -or $existingTitle.Count -gt 0 -or $existingSteps.Count -gt 0){throw 'Existing upload modal/draft preserved; no additional create/upload'}
}
function ObservedTarget {
 if([string]::IsNullOrWhiteSpace($ExpectedRuntimeId) -or [string]::IsNullOrWhiteSpace($ExpectedName)){throw 'Fresh observed RuntimeId and exact Name required'}
 if($Action -eq 'create'){
  if($ExpectedRuntimeId -cne '42,69024,4,-9837' -or $ExpectedName -cne '作成' -or $create.Count -ne 1 -or $upload.Count -gt 0){throw 'Only observed Create button allowed; open menu is preserved'}
  return $create[0]
 }
 if($Action -ne 'openUpload' -or $ExpectedName -cne '動画をアップロード'){throw 'Only Create or Upload-menu navigation allowed'}
 $found=@($upload|Where-Object{($_.GetRuntimeId()-join ',') -ceq $ExpectedRuntimeId})
 if($found.Count -ne 1){throw 'Unique fresh observed Upload menu control required'}
 return $found[0]
}
RefreshUploadStage
if($Action -eq 'read'){
 $c=@($create|ForEach-Object{[pscustomobject]@{runtimeId=($_.GetRuntimeId()-join ',');name=$_.Current.Name;type=$_.Current.ControlType.ProgrammaticName}})
 $u=@($upload|ForEach-Object{[pscustomobject]@{runtimeId=($_.GetRuntimeId()-join ',');name=$_.Current.Name;type=$_.Current.ControlType.ProgrammaticName}})
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='read';ownUc=$true;completedPaneCount=$completion.Count;fileSelectVisibleCount=$fileSelect.Count;activeTitleEditCount=$existingTitle.Count;activeDraftStepCount=$existingSteps.Count;createTargets=$c;uploadTargets=$u;assetFrozenByThisHelper=$false;inputActions=0;fileSelectionActions=0;fileAttachIntents=0;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0}|ConvertTo-Json -Depth 5 -Compress;exit
}
NoExistingUpload
$target=ObservedTarget
RefreshUploadStage;NoExistingUpload;$target=ObservedTarget
Guard
$target.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action=$Action;runtimeId=$ExpectedRuntimeId;name=$ExpectedName;invokeSentOnce=$true;fileSelectionActions=0;fileAttachIntents=0;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0;status='verify-fresh-native-menu-or-empty-upload-modal'}|ConvertTo-Json -Compress
