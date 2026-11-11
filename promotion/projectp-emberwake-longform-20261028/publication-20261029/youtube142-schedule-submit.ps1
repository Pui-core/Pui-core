param([Parameter(Mandatory=$true)][ValidateSet('read','submit')][string]$Action,[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry)
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
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Pp142Schedule{[DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'
$p=Get-Process -Id 34828;[uint32]$wpid=0
if(-not [Pp142Schedule]::IsWindow([IntPtr]69024)){throw 'Pinned window missing'}
[void][Pp142Schedule]::GetWindowThreadProcessId([IntPtr]69024,[ref]$wpid)
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
 $bp=Get-Process -Id 34828;[uint32]$again=0;[void][Pp142Schedule]::GetWindowThreadProcessId([IntPtr]69024,[ref]$again)
 if(-not [Pp142Schedule]::IsWindow([IntPtr]69024) -or $again -ne 34828 -or $bp.SessionId -ne 1 -or [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1 -or $bp.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Pinned browser identity changed'}
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

$ScheduleProofPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261029\youtube142-schedule-preflight.json'
$ScheduleProofSha256='35450f64797c57cc99540967e9913a386160f066019be8b3e5e7f0963eafd9e5'
$VisualPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261029\youtube142-preflight-native.png'
$VisualSha256='0a5afb03030020cff1217ee2e01d3c13fa301a051d7626d5976377d783b33079'
$IntentPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261029\youtube142-schedule-submit-intent.json'
function ScheduleProof142 {
 if((Get-FileHash -LiteralPath $ScheduleProofPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $ScheduleProofSha256 -or (Get-FileHash -LiteralPath $VisualPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $VisualSha256){throw 'Immutable Root schedule preflight or reviewed native image changed'}
 $sp=Get-Content -LiteralPath $ScheduleProofPath -Raw -Encoding UTF8|ConvertFrom-Json
 if($sp.issue -ne 142 -or $sp.productionIssue -ne 141 -or $sp.revision -cne 'v07' -or $sp.videoId -cne $VideoId -or $sp.channelId -cne $prepared.channelId -or -not $sp.rootReviewed -or $sp.frozenAssetSha256 -cne $PreparedSha256 -or $sp.frozenDraftSha256 -cne $DraftSha256 -or $sp.metadataProofSha256 -cne $MetadataProofSha256 -or $sp.videoSha256 -cne $VideoSha256 -or $sp.publicationIntents -ne 0 -or $sp.scheduled -ne $false -or $sp.published -ne $false){throw 'Root schedule case/tickets mismatch'}
 if($sp.schedule.date -cne '2026/10/29' -or $sp.schedule.time -cne '12:15' -or $sp.schedule.plannedForJst -cne '2026-10-29T12:15:00+09:00' -or $sp.schedule.timeZone -cne 'Asia/Tokyo' -or $sp.schedule.nativeTimeZone -cne 'デフォルトはローカル タイムゾーン（GMT+0900）' -or $sp.schedule.visibility -cne 'public' -or $sp.schedule.premiere -ne $false -or -not $sp.schedule.dateCommitted -or -not $sp.schedule.nativeTimeOptionSelected -or -not $sp.rootNativeVisual.noPremiereUnchecked -or -not $sp.rootNativeVisual.dateAndTimeDisplayedExact -or $sp.rootNativeVisual.imageSha256 -cne $VisualSha256){throw 'Root exact committed datetime/timezone/noPremiere proof absent'}
 if($sp.nativeChecks.copyright -cne 'complete_no_issues' -or $sp.nativeChecks.communityGuidelines -cne 'complete_no_issues' -or $sp.category -cne 'ゲーム' -or $sp.madeForKids -ne $false -or -not $sp.contextualDisclosureNoSelected -or -not $sp.customCoverNativeVisuallyVerified){throw 'Native checks/metadata/category/disclosure/cover proof mismatch'}
 $st=$sp.nativeSubmitTarget
 if($st.runtimeId -cne '42,69024,4,-15991' -or $st.type -cne 'ControlType.Group' -or $st.name -cne '' -or $st.automationId -cne 'done-button' -or $st.className -cne 'style-scope ytcp-uploads-dialog' -or $st.frameworkId -cne 'Gecko' -or $st.enabled -ne $true -or $st.offscreen -ne $false -or $st.focusable -ne $true -or $st.labelDescendantRuntimeId -cne '42,69024,4,-16883' -or $st.label -cne 'スケジュールを設定' -or $st.innerIsEnabled -ne $false){throw 'Observed actual custom done-button identity/provenance changed'}
 if($prepared.schedule.plannedForJst -cne $sp.schedule.plannedForJst -or $prepared.schedule.timeZone -cne 'Asia/Tokyo' -or $prepared.schedule.visibility -cne 'public' -or $prepared.schedule.premiere -ne $false -or [DateTime]::UtcNow -ge [DateTimeOffset]::Parse($sp.schedule.plannedForJst).UtcDateTime){throw 'Frozen schedule differs or target time passed'}
}
function Visible142([string]$rid,[string]$name,$type){$e=Target142 $rid $name $type;if($e.Current.IsOffscreen){throw ('Observed control offscreen: '+$rid)};return $e}
function NativeSchedule142 {
 $tab=Visibility142;ScheduleProof142
 if(-not $tab.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Visibility step changed'}
 $date=Visible142 '42,69024,4,-15799' '2026/10/29' ([Windows.Automation.ControlType]::Button)
 $dateInner=Visible142 '42,69024,4,-15798' '2026/10/29' ([Windows.Automation.ControlType]::Button)
 $time=Visible142 '42,69024,4,-15835' '' ([Windows.Automation.ControlType]::Edit)
 if($time.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -cne '12:15'){throw 'Fresh actual time differs; preserved'}
 $zone=Visible142 '42,69024,4,-15867' 'デフォルトはローカル タイムゾーン（GMT+0900）' ([Windows.Automation.ControlType]::Group)
 $publicSchedule=Visible142 '42,69024,4,-15776' '一般公開としてスケジュール ' ([Windows.Automation.ControlType]::Text)
 $checks=Visible142 '42,69024,4,-15786' '著作権チェック完了問題は検出されませんでしたコミュニティ ガイドラインの確認が完了しました問題は検出されませんでした' ([Windows.Automation.ControlType]::Group)
 $status=Visible142 '42,69024,4,-16062' 'チェックが完了しました。問題は検出されませんでした。' ([Windows.Automation.ControlType]::Text)
 $script:done=Visible142 '42,69024,4,-15991' '' ([Windows.Automation.ControlType]::Group)
 if($done.Current.AutomationId -cne 'done-button' -or $done.Current.ClassName -cne 'style-scope ytcp-uploads-dialog' -or $done.Current.FrameworkId -cne 'Gecko' -or -not $done.Current.IsKeyboardFocusable){throw 'Actual visible enabled custom command target changed'}
 $kids=$done.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition)
 $label=@($kids|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-16883' -and $_.Current.ControlType -eq [Windows.Automation.ControlType]::Button -and $_.Current.Name -ceq 'スケジュールを設定' -and -not $_.Current.IsOffscreen})
 if($label.Count -ne 1){throw 'Observed label descendant absent; do not invoke another target'}
 $walker=[Windows.Automation.TreeWalker]::ControlViewWalker;$labelParent=$walker.GetParent($label[0]);$commandParent=$walker.GetParent($labelParent)
 if(($labelParent.GetRuntimeId()-join ',') -cne '42,69024,4,-16884' -or ($commandParent.GetRuntimeId()-join ',') -cne '42,69024,4,-15991'){throw 'Native label-to-command ownership chain changed'}
 $rect=$done.Current.BoundingRectangle;$labelRect=$label[0].Current.BoundingRectangle
 if($rect.X -ne $labelRect.X -or $rect.Y -ne $labelRect.Y -or $rect.Width -ne $labelRect.Width -or $rect.Height -ne $labelRect.Height -or $rect.Width -le 0 -or $rect.Height -le 0){throw 'Actual custom target and observed label bounds differ'}
 $invoke=$done.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern)
 return [pscustomobject]@{videoId=$VideoId;date='2026/10/29';time='12:15';nativeTimeZone=$zone.Current.Name;visibility='public';rootNoPremiereVisualProofSha256=$ScheduleProofSha256;checksCompleteExact=$true;actualTargetRuntimeId='42,69024,4,-15991';actualTargetAutomationId=$done.Current.AutomationId;actualTargetEnabled=$done.Current.IsEnabled;actualTargetOffscreen=$done.Current.IsOffscreen;labelRuntimeId='42,69024,4,-16883';labelName=$label[0].Current.Name;innerIsEnabled=$label[0].Current.IsEnabled;innerInvoked=$false;intentExists=(Test-Path -LiteralPath $IntentPath)}
}
$state=NativeSchedule142
if($Action -eq 'read'){[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='read';state=$state;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0}|ConvertTo-Json -Depth 5 -Compress;exit}
if($Action -cne 'submit'){throw 'Read or schedule submit only'}
if(Test-Path -LiteralPath $IntentPath){throw 'Existing schedule submit intent: inspect native outcome; no resend'}
$state=NativeSchedule142;Guard
$record=[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;videoId=$VideoId;channelId=$prepared.channelId;acceptedRevision='v07';runId=$BoundRunId;expiresAt=$BoundExpiry;frozenAssetSha256=$PreparedSha256;frozenDraftSha256=$DraftSha256;metadataProofSha256=$MetadataProofSha256;schedulePreflightSha256=$ScheduleProofSha256;videoSha256=$VideoSha256;plannedForJst='2026-10-29T12:15:00+09:00';targetRuntimeId='42,69024,4,-15991';targetAutomationId='done-button';state=$state;publicationIntents=1;maxPublicationIntents=1;fileAttachIntents=0;osFocusActions=0;globalKeyMouseActions=0;status='pending-native-schedule-result-no-resend'}
$bytes=[Text.UTF8Encoding]::new($false).GetBytes(($record|ConvertTo-Json -Depth 6));$stream=[IO.File]::Open($IntentPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
$state=NativeSchedule142;Guard
$done.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='submit';videoId=$VideoId;targetRuntimeId='42,69024,4,-15991';nativeInvokeSentOnce=$true;innerIsEnabled=$state.innerIsEnabled;innerInvoked=$false;publicationIntents=1;maxPublicationIntents=1;fileAttachIntents=0;osFocusActions=0;globalKeyMouseActions=0;intent=$IntentPath;status='Inspect fresh native reservation/date/VID; this Invoke does not prove scheduled or public'}|ConvertTo-Json -Depth 5 -Compress
