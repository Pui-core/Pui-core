param([Parameter(Mandatory=$true)][ValidateSet('read','title','description','notKids','invoke')][string]$Action,[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry,[string]$ExpectedVideoId='2KGUzjEmfwg',[string]$ExpectedRuntimeId='',[string]$ExpectedName='')
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
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Pp134Metadata{[DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);[DllImport("user32.dll")]public static extern bool SetForegroundWindow(IntPtr h);[DllImport("user32.dll")]public static extern IntPtr GetForegroundWindow();[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'
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

$PreparedPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261028\youtube134-prepared.json'
$PreparedHash='ed72da443d041c08fa8772e7ed4c0f227613a8ccb7bf5f9d88bdcf690fa8e2c7'

$FrozenVideoHash='be3f9162f922dc3ab404eff56432b47dfa6f5e6bca72887a1e78aee19b7838da'
if($ExpectedVideoId -cne '2KGUzjEmfwg'){throw 'This helper is frozen to the observed draft video ID'}
if((Get-FileHash -LiteralPath $PreparedPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $PreparedHash){throw 'Frozen prepared metadata changed'}
$prepared=Get-Content -LiteralPath $PreparedPath -Encoding UTF8 -Raw|ConvertFrom-Json
if($prepared.issue -ne 134 -or $prepared.channelId -cne 'UCZsCpCNJ-BBKEv7EMz1P73Q' -or $prepared.videoSha256 -cne $FrozenVideoHash){throw 'Prepared account/video binding mismatch'}
if((Get-FileHash -LiteralPath $prepared.file -Algorithm SHA256).Hash.ToLowerInvariant() -cne $FrozenVideoHash){throw 'Frozen local source changed'}
$stem=[IO.Path]::GetFileNameWithoutExtension($prepared.file);$allowedTitles=@($stem,($stem -replace '-',' '),$prepared.title)
function Refresh {
 Guard
 if(-not $tab[0].GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Pinned YouTube tab changed'}
 $script:els=$doc[0].FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition)
 $links=@($script:els|Where-Object{try{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -cin @(('https://youtube.com/shorts/'+$ExpectedVideoId),('https://www.youtube.com/shorts/'+$ExpectedVideoId),('https://youtu.be/'+$ExpectedVideoId))}catch{$false}})
 if($links.Count -lt 1){throw 'Observed video ID link absent; no action'}
 $sourceTitle=@($script:els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-11478' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Edit})
 if($sourceTitle.Count -gt 1){throw 'Ambiguous source title field'}
 if($sourceTitle.Count -eq 1){$v=$sourceTitle[0].GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value;if($v -cnotin $allowedTitles){throw 'Title belongs to another draft; preserved'}}
 elseif(@($script:els|Where-Object{$_.Current.Name -ceq $prepared.title}).Count -lt 1){throw 'Frozen draft title marker absent'}
}
function ActionGuard {
 Guard
 $bp=Get-Process -Id 34828;[uint32]$again=0;[void][Pp134Metadata]::GetWindowThreadProcessId([IntPtr]69024,[ref]$again)
 if($again -ne 34828 -or $bp.SessionId -ne 1 -or $bp.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Browser identity changed'}
 if(-not $tab[0].GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Pinned selected tab changed'}
 if([long][Pp134Metadata]::GetForegroundWindow() -ne 69024){[void][Pp134Metadata]::SetForegroundWindow([IntPtr]69024)}
 if([long][Pp134Metadata]::GetForegroundWindow() -ne 69024){throw 'Normal foreground refused; no force/input'}
 Guard
}
function Target {
 if([string]::IsNullOrWhiteSpace($ExpectedRuntimeId) -or [string]::IsNullOrWhiteSpace($ExpectedName)){throw 'Fresh RuntimeId and exact observed Name required'}
 $matches=@($script:els|Where-Object{($_.GetRuntimeId()-join ',') -ceq $ExpectedRuntimeId -and $_.Current.Name -ceq $ExpectedName})
 if($matches.Count -ne 1 -or -not $matches[0].Current.IsEnabled){throw 'Unique enabled observed target required'}
 return $matches[0]
}
Refresh
if($Action -eq 'read'){
 $rows=@();foreach($e in $els){$c=$e.Current;if($c.ControlType -in @([Windows.Automation.ControlType]::Edit,[Windows.Automation.ControlType]::RadioButton,[Windows.Automation.ControlType]::TabItem,[Windows.Automation.ControlType]::Button) -and ($c.Name -match 'タイトル|視聴者に向けて|子ども向け|次へ|初期チェック|公開設定')){$value='';$selected=$null;try{$value=$e.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value}catch{};try{$selected=$e.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected}catch{};$rows+=[pscustomobject]@{runtimeId=($e.GetRuntimeId()-join ',');name=$c.Name;type=$c.ControlType.ProgrammaticName;value=$value;selected=$selected;offscreen=$c.IsOffscreen;enabled=$c.IsEnabled}}}
 [pscustomobject]@{action='read';expectedVideoId=$ExpectedVideoId;sourceSha256=$FrozenVideoHash;controls=$rows;inputActions=0;publicationIntents=0}|ConvertTo-Json -Depth 5 -Compress;exit
}
$target=Target
if($Action -in @('title','description')){
 $requiredId=if($Action -eq 'title'){'42,69024,4,-11478'}else{'42,69024,4,-11476'}
 if($ExpectedRuntimeId -cne $requiredId -or $target.Current.ControlType -ne [Windows.Automation.ControlType]::Edit){throw 'Only observed frozen title/description edit allowed'}
 $desired=if($Action -eq 'title'){$prepared.title}else{$prepared.description}
 ActionGuard;Refresh;$target=Target
 $vp=$target.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern);if($vp.Current.IsReadOnly){throw 'Metadata edit is read-only'}
 $changed=$vp.Current.Value -cne $desired
 if($changed){Guard;$vp.SetValue($desired)}
 $exact=$false;for($i=0;$i -lt 15;$i++){Guard;if($vp.Current.Value -ceq $desired){$exact=$true;break};Start-Sleep -Milliseconds 100}
 if(-not $exact){throw 'Exact metadata readback failed; no navigation'}
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action=$Action;videoId=$ExpectedVideoId;runtimeId=$ExpectedRuntimeId;changed=$changed;readbackExact=$true;publicationIntents=0}|ConvertTo-Json -Compress;exit
}
if($Action -eq 'notKids'){
 if($target.Current.ControlType -ne [Windows.Automation.ControlType]::RadioButton -or $ExpectedName -cne 'いいえ、子ども向けではありません'){throw 'Not-for-kids No radio only'}
 $selection=$target.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern)
 $changed=-not $selection.Current.IsSelected
 if($changed){ActionGuard;if($target.Current.IsOffscreen){Guard;$target.GetCurrentPattern([Windows.Automation.ScrollItemPattern]::Pattern).ScrollIntoView();Refresh;$target=Target};if($target.Current.IsOffscreen){throw 'Radio not visible after standard scroll'};ActionGuard;$selection=$target.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern);$selection.Select()}
 if(-not $selection.Current.IsSelected){throw 'No-kids selection readback failed'}
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action='notKids';videoId=$ExpectedVideoId;changed=$changed;selected=$true;publicationIntents=0}|ConvertTo-Json -Compress;exit
}
if($Action -eq 'invoke'){
 if($ExpectedName -cnotin @('次へ','初期チェック','チェック','公開設定')){throw 'Only next/check/visibility navigation allowed; publish/save/done excluded'}
 if($target.Current.IsOffscreen){throw 'Observed navigation control offscreen'}
 ActionGuard;Refresh;$target=Target
 if($target.Current.ControlType -eq [Windows.Automation.ControlType]::TabItem){Guard;$target.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Select()}
 elseif($target.Current.ControlType -eq [Windows.Automation.ControlType]::Button){Guard;$target.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()}
 else{throw 'Navigation requires observed button/tab'}
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action='navigate';videoId=$ExpectedVideoId;runtimeId=$ExpectedRuntimeId;name=$ExpectedName;publicationIntents=0;status='verify-fresh-native-step-readback'}|ConvertTo-Json -Compress;exit
}
throw 'Unsupported action'
