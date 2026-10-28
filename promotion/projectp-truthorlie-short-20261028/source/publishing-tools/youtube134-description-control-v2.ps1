param([Parameter(Mandatory=$true)][ValidateSet('read','description')][string]$Action,[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry,[string]$ExpectedVideoId='2KGUzjEmfwg',[string]$ExpectedRuntimeId='',[string]$ExpectedName='')
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
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Pp134Metadata{[DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'
$p=Get-Process -Id 34828;[uint32]$wpid=0
if(-not [Pp134Metadata]::IsWindow([IntPtr]69024)){throw 'Pinned window missing'}
[void][Pp134Metadata]::GetWindowThreadProcessId([IntPtr]69024,[ref]$wpid)
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
if($ExpectedVideoId -cne '2KGUzjEmfwg'){throw 'This helper is frozen to the observed draft video ID'}
if((Get-FileHash -LiteralPath $PreparedPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $PreparedHash){throw 'Frozen prepared metadata changed'}
$prepared=Get-Content -LiteralPath $PreparedPath -Encoding UTF8 -Raw|ConvertFrom-Json
if($prepared.issue -ne 134 -or $prepared.channelId -cne 'UCZsCpCNJ-BBKEv7EMz1P73Q' -or $prepared.videoSha256 -cne $FrozenVideoHash){throw 'Prepared account/video binding mismatch'}
if((Get-FileHash -LiteralPath $prepared.file -Algorithm SHA256).Hash.ToLowerInvariant() -cne $FrozenVideoHash){throw 'Frozen local source changed'}
$stem=[IO.Path]::GetFileNameWithoutExtension($prepared.file);$allowedTitles=@($prepared.title)
function Refresh {
 Guard
 $ownNow=@($doc[0].FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition)|Where-Object{try{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -ceq 'https://studio.youtube.com/channel/UCZsCpCNJ-BBKEv7EMz1P73Q'}catch{$false}})
 if($ownNow.Count -lt 1){throw 'Own account marker changed'}
 if(-not $tab[0].GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Pinned YouTube tab changed'}
 $script:els=$doc[0].FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition)
 $links=@($script:els|Where-Object{try{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -cin @(('https://youtube.com/shorts/'+$ExpectedVideoId),('https://www.youtube.com/shorts/'+$ExpectedVideoId),('https://youtu.be/'+$ExpectedVideoId))}catch{$false}})
 if($links.Count -lt 1){throw 'Observed video ID link absent; no action'}
 $sourceTitle=@($script:els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-11478' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Edit})
 if($sourceTitle.Count -gt 1){throw 'Ambiguous source title field'}
 if($sourceTitle.Count -eq 1){$v=$sourceTitle[0].GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value;if($v -cnotin $allowedTitles){throw 'Title belongs to another draft; preserved'}}
 elseif(@($script:els|Where-Object{$_.Current.Name -ceq $prepared.title}).Count -lt 1){throw 'Frozen draft title marker absent'}
}
function BoundScopeGuard {
 Guard
 $bp=Get-Process -Id 34828;[uint32]$again=0;[void][Pp134Metadata]::GetWindowThreadProcessId([IntPtr]69024,[ref]$again)
 if($again -ne 34828 -or $bp.SessionId -ne 1 -or $bp.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Browser identity changed'}
 if(-not $tab[0].GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Pinned selected tab changed'}
 Guard
}
function Target {
 if([string]::IsNullOrWhiteSpace($ExpectedRuntimeId) -or [string]::IsNullOrWhiteSpace($ExpectedName)){throw 'Fresh RuntimeId and exact observed Name required'}
 $matches=@($script:els|Where-Object{($_.GetRuntimeId()-join ',') -ceq $ExpectedRuntimeId -and $_.Current.Name -ceq $ExpectedName})
 if($matches.Count -ne 1 -or -not $matches[0].Current.IsEnabled){throw 'Unique enabled observed target required'}
 return $matches[0]
}

$ExpectedBeforeHash='0cea4d8b7cd2995a6f0b83259adb80339cca69d120b06daaf30fceaccdbd5616'

function TextHash([string]$v){$sha=[Security.Cryptography.SHA256]::Create();try{return (($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($v))|ForEach-Object{$_.ToString('x2')}) -join '')}finally{$sha.Dispose()}}
Refresh
$target=Target
if($ExpectedRuntimeId -cne '42,69024,4,-11476' -or $ExpectedName -cne '視聴者に向けて動画の内容を紹介しましょう（@ を使用して、チャンネルをメンションできます）' -or $target.Current.ControlType -ne [Windows.Automation.ControlType]::Edit){throw 'Frozen description control only'}
$vp=$target.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern)
if($vp.Current.IsReadOnly){throw 'Read-only description; no fallback'}
$before=$vp.Current.Value;$desired=$prepared.description
if($Action -eq 'read'){[pscustomobject]@{action='read';videoId=$ExpectedVideoId;descriptionExact=($before -ceq $desired);expectedBefore=(TextHash $before) -ceq $ExpectedBeforeHash;inputActions=0}|ConvertTo-Json -Compress;exit}
if($before -cne $desired -and (TextHash $before) -cne $ExpectedBeforeHash){throw 'Description changed outside this operation; preserved'}
BoundScopeGuard;Refresh;$target=Target
$vp=$target.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern)
if($vp.Current.IsReadOnly -or $vp.Current.Value -cne $before){throw 'Description changed before write; preserved'}
$changed=$before -cne $desired
if($changed){Guard;$vp.SetValue($desired)}
$exact=$false;for($i=0;$i -lt 15;$i++){Guard;if($vp.Current.Value -ceq $desired){$exact=$true;break};Start-Sleep -Milliseconds 100}
if(-not $exact){throw 'ValuePattern readback not exact; no keyboard/focus fallback'}
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action='description';method='UIA_ValuePattern_bound_control_no_OS_focus';videoId=$ExpectedVideoId;changed=$changed;readbackExact=$true;foregroundCalls=0;keyboardMouseCalls=0;publicationIntents=0}|ConvertTo-Json -Compress
