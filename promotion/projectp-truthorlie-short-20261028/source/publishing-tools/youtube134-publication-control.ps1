param([Parameter(Mandatory=$true)][ValidateSet('read','publicSelect','publish')][string]$Action,[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry,[string]$ExpectedPublicRuntimeId='42,69024,4,-15858',[string]$ExpectedButtonRuntimeId='42,69024,4,-15935')
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
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class PpPublication134{[DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'
$p=Get-Process -Id 34828;[uint32]$wpid=0
if(-not [PpPublication134]::IsWindow([IntPtr]69024)){throw 'Pinned window missing'}
[void][PpPublication134]::GetWindowThreadProcessId([IntPtr]69024,[ref]$wpid)
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
$PreflightPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261028\visibility-select134.json'
$IntentPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261028\youtube134-publication-intent.json'

$PreparedHash='e99687f05a17de1267dc72df690d54b8ee52b23be67708d7f3ed2c486ab4784c'
$PreflightHash='da6b81c28ab4e6036097105661b02e466b5baaad1d2e5d0fdf6f9d0b70db88c3'
$FrozenVideoHash='be3f9162f922dc3ab404eff56432b47dfa6f5e6bca72887a1e78aee19b7838da'
$VideoId='2KGUzjEmfwg'
$ChecksName='著作権チェック完了問題は検出されませんでしたコミュニティ ガイドラインの確認が完了しました問題は検出されませんでした'
if($ExpectedPublicRuntimeId -cne '42,69024,4,-15858' -or $ExpectedButtonRuntimeId -cne '42,69024,4,-15935'){throw 'Only the fresh observed public radio and final Publish button are permitted'}
function NormalizeWhite([string]$s){return [regex]::Replace($s,'\s+',' ').Trim()}
function Frozen {
 if((Get-FileHash -LiteralPath $PreparedPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $PreparedHash){throw 'Frozen v2 prepared changed'}
 $script:prepared=Get-Content -LiteralPath $PreparedPath -Raw -Encoding UTF8|ConvertFrom-Json
 if($prepared.issue -ne 134 -or $prepared.channelId -cne 'UCZsCpCNJ-BBKEv7EMz1P73Q' -or $prepared.videoSha256 -cne $FrozenVideoHash -or $prepared.settings.madeForKids -ne $false){throw 'Frozen issue/channel/video/NoKids mismatch'}
 if((Get-FileHash -LiteralPath $prepared.file -Algorithm SHA256).Hash.ToLowerInvariant() -cne $FrozenVideoHash){throw 'Frozen MP4 changed'}
}
function RefreshBase {
 Guard;Frozen
 $bp=Get-Process -Id 34828;[uint32]$again=0
 if(-not [PpPublication134]::IsWindow([IntPtr]69024)){throw 'Pinned browser window missing'}
 [void][PpPublication134]::GetWindowThreadProcessId([IntPtr]69024,[ref]$again)
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

function PreflightProof {
 if((Get-FileHash -LiteralPath $PreflightPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $PreflightHash){throw 'Hashed native metadata preflight changed'}
 $proof=Get-Content -LiteralPath $PreflightPath -Raw -Encoding UTF8|ConvertFrom-Json
 if($proof.action -cne 'visibility-tab-only' -or $proof.videoId -cne $VideoId -or $proof.runtimeId -cne '42,69024,4,-11486' -or -not $proof.selectedReadbackExact -or -not $proof.preflight.titleExact -or -not $proof.preflight.descriptionExact -or -not $proof.preflight.notKidsSelected -or -not $proof.preflight.ready -or $proof.publicationIntents -ne 0 -or $proof.fileAttachIntents -ne 0){throw 'Native exact title/description/NoKids preflight is required'}
}
function One([string]$rid,[string]$name,$type){
 $found=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq $rid -and $_.Current.Name -ceq $name -and $_.Current.ControlType -eq $type})
 if($found.Count -ne 1 -or -not $found[0].Current.IsEnabled -or $found[0].Current.IsOffscreen){throw ('Observed enabled visible control changed: '+$rid)}
 return $found[0]
}
function NativeState {
 RefreshBase;PreflightProof
 $visibility=One '42,69024,4,-11486' '公開設定' ([Windows.Automation.ControlType]::TabItem)
 if(-not $visibility.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Visibility upload step must be selected'}
 $heading=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-11369' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Text -and -not $_.Current.IsOffscreen})
 if($heading.Count -ne 1 -or (NormalizeWhite $heading[0].Current.Name) -cne (NormalizeWhite $prepared.title)){throw 'Actual title differs from frozen v2 after whitespace normalization'}
 $script:public=One $ExpectedPublicRuntimeId '公開' ([Windows.Automation.ControlType]::RadioButton)
 $private=One '42,69024,4,-15842' '非公開' ([Windows.Automation.ControlType]::RadioButton)
 $unlisted=One '42,69024,4,-15850' '限定公開' ([Windows.Automation.ControlType]::RadioButton)
 $schedule=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-15869' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Button -and -not $_.Current.IsOffscreen})
 if($schedule.Count -ne 1){throw 'Observed schedule expand control missing'}
 $scheduleClosed=$schedule[0].Current.Name -ceq 'Click to expand'
 $expandState='not-exposed; exact Click to expand label used';$ep=$null
 if($schedule[0].TryGetCurrentPattern([Windows.Automation.ExpandCollapsePattern]::Pattern,[ref]$ep)){$expandState=$ep.Current.ExpandCollapseState.ToString();$scheduleClosed=$scheduleClosed -and $ep.Current.ExpandCollapseState -eq [Windows.Automation.ExpandCollapseState]::Collapsed}
 $editors=@($els|Where-Object{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Edit -and -not $_.Current.IsOffscreen -and -not (($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-15752' -and $_.Current.Name -ceq 'チャンネル内で検索')})
 $checks=One '42,69024,4,-11461' $ChecksName ([Windows.Automation.ControlType]::Group)
 $script:publish=One $ExpectedButtonRuntimeId '公開' ([Windows.Automation.ControlType]::Button)
 $publicSelected=$public.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected
 $privateSelected=$private.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected
 $unlistedSelected=$unlisted.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected
 return [pscustomobject]@{videoId=$VideoId;actualTitleMatchesV2WhiteNormalized=$true;nativeMetadataPreflightHash=$PreflightHash;preflightExactTitleDescriptionNoKids=$true;publicSelected=$publicSelected;privateSelected=$privateSelected;unlistedSelected=$unlistedSelected;scheduleClosed=$scheduleClosed;scheduleExpandName=$schedule[0].Current.Name;scheduleExpandState=$expandState;visibleNonSearchEditCount=$editors.Count;noSchedule=($publicSelected -and -not $privateSelected -and -not $unlistedSelected -and $scheduleClosed -and $editors.Count -eq 0);checksCompleteExact=$true;finalButtonName=$publish.Current.Name;finalButtonRuntimeId=$ExpectedButtonRuntimeId;intentExists=(Test-Path -LiteralPath $IntentPath)}
}
$state=NativeState
if($Action -eq 'read'){
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action='read';state=$state;publicationIntents=0;fileAttachIntents=0;osFocusActions=0;globalKeyMouseActions=0}|ConvertTo-Json -Depth 5 -Compress;exit
}
if(Test-Path -LiteralPath $IntentPath){throw 'Existing publication intent: inspect actual outcome; no repeat'}
if($Action -eq 'publicSelect'){
 if(-not $state.scheduleClosed -or $state.visibleNonSearchEditCount -ne 0){throw 'Schedule content expanded/present; preserve it without changing radio'}
 $actions=0
 if(-not $state.publicSelected){Guard;$public.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Select();$actions=1}
 $confirmed=$false;for($i=0;$i -lt 15;$i++){Guard;try{if($public.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){$confirmed=$true;break}}catch{};Start-Sleep -Milliseconds 100}
 if(-not $confirmed){throw 'Public radio selected readback failed; inspect fresh state'}
 $state=NativeState
 if(-not $state.publicSelected -or $state.privateSelected -or $state.unlistedSelected){throw 'Fresh radio readback mismatch'}
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action='publicSelect';state=$state;radioSelectionActions=$actions;publicationIntents=0;fileAttachIntents=0;osFocusActions=0;globalKeyMouseActions=0}|ConvertTo-Json -Depth 5 -Compress;exit
}
if($Action -ne 'publish'){throw 'Unsupported action'}
if(-not $state.publicSelected -or -not $state.noSchedule -or -not $state.checksCompleteExact -or $state.finalButtonName -cne '公開'){throw 'Public/no-schedule/native-checks/final-button preconditions failed'}
$state=NativeState
if(-not $state.noSchedule -or -not $state.checksCompleteExact){throw 'Fresh public/no-schedule/checks state changed before intent'}
Guard
$record=[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=134;videoId=$VideoId;channelId='UCZsCpCNJ-BBKEv7EMz1P73Q';runId=$BoundRunId;expiresAt=$BoundExpiry;sourceVideoSha256=$FrozenVideoHash;preparedV2Sha256=$PreparedHash;nativeMetadataPreflightSha256=$PreflightHash;finalButtonRuntimeId=$ExpectedButtonRuntimeId;finalButtonName='公開';state=$state;publicationIntents=1;maxPublicationIntents=1;fileAttachIntents=0;osFocusActions=0;globalKeyMouseActions=0;status='pending-native-publication-readback-no-retry'}
$bytes=[Text.UTF8Encoding]::new($false).GetBytes(($record|ConvertTo-Json -Depth 6))
$stream=[IO.File]::Open($IntentPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
Guard;$state=NativeState
if(-not $state.noSchedule -or -not $state.checksCompleteExact){throw 'State changed after intent; no retry or publication call'}
Guard
$publish.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action='publish';videoId=$VideoId;nativeInvokeSentOnce=$true;publicationIntents=1;maxPublicationIntents=1;fileAttachIntents=0;osFocusActions=0;globalKeyMouseActions=0;intent=$IntentPath;status='verify-fresh-native-and-public-visibility-readback-not-yet-confirmed'}|ConvertTo-Json -Depth 4 -Compress
