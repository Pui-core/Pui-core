param([Parameter(Mandatory=$true)][ValidateSet('read','select')][string]$Action,[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry)
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
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Pp142Visibility{[DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'
$p=Get-Process -Id 34828;[uint32]$wpid=0
if(-not [Pp142Visibility]::IsWindow([IntPtr]69024)){throw 'Pinned window missing'}
[void][Pp142Visibility]::GetWindowThreadProcessId([IntPtr]69024,[ref]$wpid)
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

$PreparedPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261029\youtube142-prepared.json'
$DraftPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261029\youtube142-draft-binding.json'

$PreparedSha256='d487b218626f916c1ca281fa7f58fc306ff5bcdd8d657bc846af3b244aee3fec'
$DraftSha256='9736e2d1c74f731471395d1528c715ed67e7a34b48f70c296a8004b42a0ab89e'
$VideoSha256='ce39d1223e7a9dfc59488b9c828f5c44bac363fd59334484f519f5dbbdef7241'
$VideoId='VdD_3xdOGFQ'
$LegacyDescriptionSha256='0cea4d8b7cd2995a6f0b83259adb80339cca69d120b06daaf30fceaccdbd5616'
function TextSha([string]$text){$h=[Security.Cryptography.SHA256]::Create();try{return (($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($text))|ForEach-Object{$_.ToString('x2')}) -join '')}finally{$h.Dispose()}}
function Frozen142 {
 if((Get-FileHash -LiteralPath $PreparedPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $PreparedSha256 -or (Get-FileHash -LiteralPath $DraftPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $DraftSha256){throw 'Frozen asset or draft ticket changed'}
 $script:prepared=Get-Content -LiteralPath $PreparedPath -Raw -Encoding UTF8|ConvertFrom-Json;$draft=Get-Content -LiteralPath $DraftPath -Raw -Encoding UTF8|ConvertFrom-Json
 if($prepared.issue -ne 142 -or $prepared.productionIssue -ne 141 -or $prepared.acceptedRevision -cne 'v07' -or $prepared.rootMediaAccepted -ne $true -or $prepared.channelId -cne 'UCZsCpCNJ-BBKEv7EMz1P73Q' -or $prepared.videoSha256 -cne $VideoSha256 -or $draft.issue -ne 142 -or $draft.productionIssue -ne 141 -or $draft.revision -cne 'v07' -or $draft.videoId -cne $VideoId -or $draft.channelId -cne $prepared.channelId -or $draft.frozenAssetSha256 -cne $PreparedSha256 -or $draft.sourceVideoSha256 -cne $VideoSha256 -or $draft.fileAttachIntents -ne 1){throw 'Accepted v07/account/video/one-attachment binding mismatch'}
 if((Get-FileHash -LiteralPath $prepared.file -Algorithm SHA256).Hash.ToLowerInvariant() -cne $VideoSha256){throw 'Frozen accepted video changed'}
}
function Refresh142 {
 Guard;Frozen142
 $bp=Get-Process -Id 34828;[uint32]$again=0;[void][Pp142Visibility]::GetWindowThreadProcessId([IntPtr]69024,[ref]$again)
 if(-not [Pp142Visibility]::IsWindow([IntPtr]69024) -or $again -ne 34828 -or $bp.SessionId -ne 1 -or [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1 -or $bp.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Pinned browser identity changed'}
 $tabsNow=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::TabItem))
 $selected=@($tabsNow|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-1253' -and $_.Current.Name -match 'YouTube Studio$'})
 if($selected.Count -ne 1 -or -not $selected[0].GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Pinned YouTube tab changed'}
 $docsNow=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Document))
 $docNow=@($docsNow|Where-Object{$_.Current.Name -match 'YouTube Studio$'});if($docNow.Count -ne 1){throw 'Unique YouTube document required'}
 $script:els=$docNow[0].FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition)
 $ownNow=@($els|Where-Object{try{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -ceq 'https://studio.youtube.com/channel/UCZsCpCNJ-BBKEv7EMz1P73Q'}catch{$false}})
 $vid=@($els|Where-Object{try{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -cin @(('https://youtu.be/'+$VideoId),('https://www.youtube.com/watch?v='+$VideoId),('https://youtube.com/watch?v='+$VideoId))}catch{$false}})
 if($ownNow.Count -lt 1 -or $vid.Count -lt 1){throw 'Fresh own UC or exact new video ID link absent'}
}
function Target142([string]$rid,[string]$name,$type){$m=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq $rid -and $_.Current.Name -ceq $name -and $_.Current.ControlType -eq $type -and $_.Current.IsEnabled});if($m.Count -ne 1){throw ('Unique enabled observed control required: '+$rid)};return $m[0]}
$TitleName='動画について説明するタイトルを追加（@ を使用して、チャンネルをメンションできます）'
$DescriptionName='視聴者に向けて動画の内容を紹介しましょう（@ を使用して、チャンネルをメンションできます）'
function Fields142 {
 $script:titleEdit=Target142 '42,69024,4,-15920' $TitleName ([Windows.Automation.ControlType]::Edit)
 $script:descriptionEdit=Target142 '42,69024,4,-15918' $DescriptionName ([Windows.Automation.ControlType]::Edit)
 $script:noKids=Target142 '42,69024,4,-15971' 'いいえ、子ども向けではありません' ([Windows.Automation.ControlType]::RadioButton)
 $tv=$titleEdit.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value;$dv=$descriptionEdit.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value
 $stem=[IO.Path]::GetFileNameWithoutExtension($prepared.file);$titleAllowed=$tv -cin @($stem,($stem -replace '-',' '),$prepared.title)
 return [pscustomobject]@{titleExact=($tv -ceq $prepared.title);titleBeforeAllowed=$titleAllowed;titleSha256=(TextSha $tv);descriptionExact=($dv -ceq $prepared.description);descriptionDefaultMatched=((TextSha $dv) -ceq $LegacyDescriptionSha256);descriptionSha256=(TextSha $dv);notKidsSelected=$noKids.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected;categoryNativeVerified=$false}
}

$MetadataProofPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261029\youtube142-metadata-verified.json'

$MetadataProofSha256='7547ecc53037ac01fe0c417e5d4a386ca611136926db5801d06c43f6f5c21326'
function Proof142 {
 if((Get-FileHash -LiteralPath $MetadataProofPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $MetadataProofSha256){throw 'Immutable exact-metadata receipt changed'}
 $p=Get-Content -LiteralPath $MetadataProofPath -Raw -Encoding UTF8|ConvertFrom-Json
 if($p.issue -ne 142 -or $p.videoId -cne $VideoId -or $p.frozenAssetSha256 -cne $PreparedSha256 -or $p.frozenDraftSha256 -cne $DraftSha256 -or -not $p.titleExact -or -not $p.descriptionExact -or -not $p.notKidsSelected -or $p.titleSha256 -cne (TextSha $prepared.title) -or $p.descriptionSha256 -cne (TextSha $prepared.description) -or $p.publicationIntents -ne 0){throw 'Native exact title/description/NoKids proof mismatch'}
 # categoryNativeVerified=false was historical at that observation; never use it
 # as a constraint on a later actual category selection.
}
function Visibility142 {
 Refresh142;Proof142
 $h=@($els|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-15771' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Text})
 if($h.Count -ne 1 -or ([regex]::Replace($h[0].Current.Name,'\s+',' ').Trim()) -cne ([regex]::Replace($prepared.title,'\s+',' ').Trim())){throw 'Current video title heading differs from frozen metadata'}
 return (Target142 '42,69024,4,-15932' '公開設定' ([Windows.Automation.ControlType]::TabItem))
}
$target=Visibility142;$selected=$target.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected
if($Action -eq 'read'){
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='read';videoId=$VideoId;visibilityRuntimeId='42,69024,4,-15932';selected=$selected;nativeExactMetadataProofMatched=$true;proofSha256=$MetadataProofSha256;categoryStateNotFrozenHere=$true;inputActions=0;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0}|ConvertTo-Json -Compress;exit
}
if($Action -ne 'select'){throw 'Only read or fixed visibility Tab selection is allowed'}
$actions=0
if(-not $selected){
 $state=Fields142;if(-not $state.titleExact -or -not $state.descriptionExact -or -not $state.notKidsSelected){throw 'Fresh exact metadata/NoKids required before tab change'}
 $target=Visibility142;$state=Fields142
 if(-not $state.titleExact -or -not $state.descriptionExact -or -not $state.notKidsSelected -or $target.Current.IsOffscreen){throw 'Fresh exact fields or visible Tab changed'}
 Guard;$target.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Select();$actions=1
}
$confirmed=$false;for($i=0;$i -lt 15;$i++){Guard;try{if($target.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){$confirmed=$true;break}}catch{};Start-Sleep -Milliseconds 100}
if(-not $confirmed){throw 'Visibility selected readback missing; no repeat; inspect fresh native state'}
$target=Visibility142
if(-not $target.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Fresh visibility selected readback failed'}
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='visibilityTab';videoId=$VideoId;runtimeId='42,69024,4,-15932';selectedReadbackExact=$true;metadataProofSha256=$MetadataProofSha256;navigationActions=$actions;categoryStateNotFrozenHere=$true;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0;status='Read fresh schedule/visibility controls; no final submit'}|ConvertTo-Json -Compress
