param([ValidateSet('read','select')][string]$Action='read',[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry,[string]$ExpectedRuntimeId='42,69024,4,-11486',[string]$ExpectedName='公開設定')
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
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class PpVisibility134{[DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'
$p=Get-Process -Id 34828;[uint32]$wpid=0
if(-not [PpVisibility134]::IsWindow([IntPtr]69024)){throw 'Pinned window missing'}
[void][PpVisibility134]::GetWindowThreadProcessId([IntPtr]69024,[ref]$wpid)
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

$PreparedPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261028\youtube134-prepared-v2.json'

$PreparedHash='e99687f05a17de1267dc72df690d54b8ee52b23be67708d7f3ed2c486ab4784c'
$FrozenVideoHash='be3f9162f922dc3ab404eff56432b47dfa6f5e6bca72887a1e78aee19b7838da'
$VideoId='2KGUzjEmfwg'
if($ExpectedRuntimeId -cne '42,69024,4,-11486' -or $ExpectedName -cne '公開設定'){throw 'Only the observed visibility Tab is allowed'}
function Frozen {
 if((Get-FileHash -LiteralPath $PreparedPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $PreparedHash){throw 'Frozen v2 prepared changed'}
 $script:prepared=Get-Content -LiteralPath $PreparedPath -Raw -Encoding UTF8|ConvertFrom-Json
 if($prepared.issue -ne 134 -or $prepared.channelId -cne 'UCZsCpCNJ-BBKEv7EMz1P73Q' -or $prepared.videoSha256 -cne $FrozenVideoHash -or $prepared.settings.madeForKids -ne $false){throw 'Frozen issue/channel/video/NoKids mismatch'}
 if((Get-FileHash -LiteralPath $prepared.file -Algorithm SHA256).Hash.ToLowerInvariant() -cne $FrozenVideoHash){throw 'Frozen MP4 changed'}
}
function RefreshBase {
 Guard;Frozen
 $bp=Get-Process -Id 34828;[uint32]$again=0
 if(-not [PpVisibility134]::IsWindow([IntPtr]69024)){throw 'Pinned browser window missing'}
 [void][PpVisibility134]::GetWindowThreadProcessId([IntPtr]69024,[ref]$again)
 if($again -ne 34828 -or $bp.SessionId -ne 1 -or [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1 -or $bp.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Browser identity changed'}
 $currentTabs=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::TabItem))
 $selected=@($currentTabs|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-1253' -and $_.Current.Name -match 'YouTube Studio$'})
 if($selected.Count -ne 1 -or -not $selected[0].GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Pinned YouTube browser tab changed'}
 $currentDocs=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Document))
 $currentDoc=@($currentDocs|Where-Object{$_.Current.Name -match 'YouTube Studio$'})
 if($currentDoc.Count -ne 1){throw 'Unique YouTube Studio document required'}
 $script:els=$currentDoc[0].FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition)
 $ownNow=@($els|Where-Object{try{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -ceq 'https://studio.youtube.com/channel/UCZsCpCNJ-BBKEv7EMz1P73Q'}catch{$false}})
 if($ownNow.Count -lt 1){throw 'Own UC marker absent in fresh document'}
 $video=@($els|Where-Object{try{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -cin @(('https://youtube.com/shorts/'+$VideoId),('https://www.youtube.com/shorts/'+$VideoId),('https://youtu.be/'+$VideoId))}catch{$false}})
 if($video.Count -lt 1){throw 'Exact observed video ID link absent'}
}
function VisibilityTab {
 $match=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq $ExpectedRuntimeId -and $_.Current.Name -ceq $ExpectedName -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::TabItem})
 if($match.Count -ne 1 -or -not $match[0].Current.IsEnabled -or $match[0].Current.IsOffscreen){throw 'Unique enabled visible observed visibility Tab required'}
 return $match[0]
}
function Preflight {
 $t=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-11478' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Edit})
 $d=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-11476' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Edit})
 $n=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-11496' -and $_.Current.Name -ceq 'いいえ、子ども向けではありません' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::RadioButton})
 if($t.Count -ne 1 -or $d.Count -ne 1 -or $n.Count -ne 1){throw 'Exact title/description/NoKids controls are required before navigation'}
 $titleExact=$t[0].GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -ceq $prepared.title
 $descriptionExact=$d[0].GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -ceq $prepared.description
 $noKids=$n[0].GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected
 return [pscustomobject]@{titleExact=$titleExact;descriptionExact=$descriptionExact;notKidsSelected=$noKids;ready=($titleExact -and $descriptionExact -and $noKids)}
}
RefreshBase
$target=VisibilityTab
$check=Preflight
if($Action -eq 'read'){
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action='read';videoId=$VideoId;runtimeId=$ExpectedRuntimeId;name=$ExpectedName;visibilitySelected=$target.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected;preflight=$check;navigationActions=0;publicationIntents=0;fileAttachIntents=0;osFocusActions=0;globalKeyMouseActions=0}|ConvertTo-Json -Depth 4 -Compress;exit
}
if(-not $check.ready){throw 'Frozen exact title/description and NoKids are required; no edits performed'}
$already=$target.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected
$method='already-selected';$actions=0
if(-not $already){
 RefreshBase;$target=VisibilityTab;$check=Preflight
 if(-not $check.ready){throw 'Metadata changed immediately before visibility navigation'}
 Guard
 $pattern=$null
 if($target.TryGetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern,[ref]$pattern)){$pattern.Select();$method='SelectionItemPattern.Select'}
 else{$target.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke();$method='InvokePattern.Invoke'}
 $actions=1
}
$confirmed=$false
for($i=0;$i -lt 15;$i++){Guard;try{if($target.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){$confirmed=$true;break}}catch{};Start-Sleep -Milliseconds 100}
if(-not $confirmed){throw 'Visibility selected readback absent; Root must inspect fresh state before any further action'}
RefreshBase
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action='visibility-tab-only';videoId=$VideoId;runtimeId=$ExpectedRuntimeId;name=$ExpectedName;selectedReadbackExact=$true;method=$method;preflight=$check;navigationActions=$actions;publicationIntents=0;fileAttachIntents=0;osFocusActions=0;globalKeyMouseActions=0;status='read-fresh-visibility-state-no-publication-performed'}|ConvertTo-Json -Depth 4 -Compress
