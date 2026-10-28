param([ValidateSet('read','closeCompleted134')][string]$Action='read',[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry)
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
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Pp142Entry{[DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'
$p=Get-Process -Id 34828;[uint32]$wpid=0
if(-not [Pp142Entry]::IsWindow([IntPtr]69024)){throw 'Pinned window missing'}
[void][Pp142Entry]::GetWindowThreadProcessId([IntPtr]69024,[ref]$wpid)
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

$CompletedReceiptPath='\\wsl.localhost\Ubuntu\home\pui\.claude\projectp-youtube\receipts\2026-10-28-truthorlie134-public.json'

$CompletedReceiptSha256='7b544094f9ac8d66e98b79c5d3ba3c3a59bde07d42cb8516587850f6a2cbb687'
function VerifyPublished134 {
 if((Get-FileHash -LiteralPath $CompletedReceiptPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $CompletedReceiptSha256){throw 'Completed 134 receipt changed; inspect canonical before closing'}
 $completed=Get-Content -LiteralPath $CompletedReceiptPath -Raw -Encoding UTF8|ConvertFrom-Json
 if($completed.issue -ne 134 -or $completed.state -cne 'public_confirmed' -or $completed.videoId -cne '2KGUzjEmfwg' -or $completed.channelId -cne 'UCZsCpCNJ-BBKEv7EMz1P73Q' -or $completed.visibility.private -ne $false -or $completed.visibility.unlisted -ne $false -or -not $completed.visibility.ownChannelExact){throw 'Canonical 134 public identity is not confirmed'}
}
function RefreshEntry {
 Guard;VerifyPublished134
 $bp=Get-Process -Id 34828;[uint32]$again=0
 if(-not [Pp142Entry]::IsWindow([IntPtr]69024)){throw 'Pinned browser window absent'}
 [void][Pp142Entry]::GetWindowThreadProcessId([IntPtr]69024,[ref]$again)
 if($again -ne 34828 -or $bp.SessionId -ne 1 -or [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1 -or $bp.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Pinned browser identity changed'}
 $tabsNow=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::TabItem))
 $selected=@($tabsNow|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-1253' -and $_.Current.Name -match 'YouTube Studio$'})
 if($selected.Count -ne 1 -or -not $selected[0].GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Pinned YouTube browser tab not selected'}
 $docsNow=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Document))
 $docNow=@($docsNow|Where-Object{$_.Current.Name -match 'YouTube Studio$'})
 if($docNow.Count -ne 1){throw 'Unique YouTube Studio document required'}
 $script:els=$docNow[0].FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition)
 $ownNow=@($els|Where-Object{try{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -ceq 'https://studio.youtube.com/channel/UCZsCpCNJ-BBKEv7EMz1P73Q'}catch{$false}})
 if($ownNow.Count -lt 1){throw 'Own UC marker absent in fresh document'}
 $script:panes=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-14614' -and $_.Current.Name -ceq '動画の公開日時' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Pane -and -not $_.Current.IsOffscreen -and $_.Current.IsEnabled})
 $script:close=$null;$script:ready=$false;$script:shareMatched=$false;$script:dateMatched=$false
 if($panes.Count -eq 1){
  $inside=$panes[0].FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition)
  $shares=@($inside|Where-Object{try{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-14701' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and -not $_.Current.IsOffscreen -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -ceq 'https://youtube.com/shorts/2KGUzjEmfwg?feature=share'}catch{$false}})
  $dates=@($inside|Where-Object{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Text -and $_.Current.Name -match '^公開日\s*[:：]\s*2026/10/28\s*$' -and -not $_.Current.IsOffscreen})
  $buttons=@($inside|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-14713' -and $_.Current.Name -ceq '閉じる' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Button -and $_.Current.IsEnabled -and -not $_.Current.IsOffscreen})
  $script:shareMatched=$shares.Count -eq 1;$script:dateMatched=$dates.Count -eq 1
  if($buttons.Count -eq 1){$script:close=$buttons[0]}
  $script:ready=$shareMatched -and $dateMatched -and $null -ne $close
 }
}
RefreshEntry
if($Action -eq 'read'){
 $create=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-9837' -and $_.Current.Name -ceq '作成' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Button -and $_.Current.IsEnabled -and -not $_.Current.IsOffscreen})
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='read';ownUc=$true;pinnedBrowserAndSelectedTab=$true;canonical134PublicConfirmed=$true;completed134PaneCount=$panes.Count;shareLink134Exact=$shareMatched;publishedDate134Exact=$dateMatched;close14713Ready=$ready;create9837Available=($create.Count -eq 1);assetAcceptedFor142=$false;inputActions=0;fileAttachIntents=0;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0}|ConvertTo-Json -Depth 4 -Compress;exit
}
if($Action -ne 'closeCompleted134'){throw 'Only read or completed-134-modal close is allowed'}
if(-not $ready){throw 'Observed owned public-completion pane/share/date/close binding absent; no action'}
RefreshEntry
if(-not $ready){throw 'Completed modal binding changed before close'}
Guard
$close.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='closeCompleted134';targetRuntimeId='42,69024,4,-14713';targetName='閉じる';invokeSentOnce=$true;publicationIntents=0;fileAttachIntents=0;osFocusActions=0;globalKeyMouseActions=0;status='verify-fresh-native-pane-closed-before-create-upload'}|ConvertTo-Json -Compress
