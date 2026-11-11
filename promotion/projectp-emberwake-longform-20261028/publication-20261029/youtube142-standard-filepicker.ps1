param([Parameter(Mandatory=$true)][ValidateSet('read','set','open')][string]$Action,[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry)
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
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Pp142FileContext{[DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}'
$p=Get-Process -Id 34828;[uint32]$wpid=0
if(-not [Pp142FileContext]::IsWindow([IntPtr]69024)){throw 'Pinned window missing'}
[void][Pp142FileContext]::GetWindowThreadProcessId([IntPtr]69024,[ref]$wpid)
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
$IntentPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261029\youtube142-file-attach-intent.json'

$PreparedSha256='d487b218626f916c1ca281fa7f58fc306ff5bcdd8d657bc846af3b244aee3fec'
$FrozenVideoSha256='ce39d1223e7a9dfc59488b9c828f5c44bac363fd59334484f519f5dbbdef7241'
$FrozenFile='F:\Videos\ProjectP-EMBERWAKE-Longform-2026-10-28\demo07-natural\videos\emberwake-v07-bgm.mp4'
$Dialog=[IntPtr]30805784;$Filename=[IntPtr]219288902;$Open=[IntPtr]24122864
Add-Type -TypeDefinition @'
using System;using System.Text;using System.Runtime.InteropServices;
public class Pp142StandardPicker {
 [DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);
 [DllImport("user32.dll")]public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")]public static extern bool IsWindowEnabled(IntPtr h);
 [DllImport("user32.dll")]public static extern bool IsChild(IntPtr p,IntPtr h);
 [DllImport("user32.dll")]public static extern IntPtr GetWindow(IntPtr h,uint c);
 [DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);
 [DllImport("user32.dll")]public static extern int GetDlgCtrlID(IntPtr h);
 [DllImport("user32.dll")]public static extern IntPtr GetDlgItem(IntPtr h,int id);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern int GetClassName(IntPtr h,StringBuilder s,int n);
 [DllImport("user32.dll",EntryPoint="GetWindowLongPtrW")]static extern IntPtr GetLongPtr(IntPtr h,int n);
 [DllImport("user32.dll",EntryPoint="GetWindowLongW")]static extern int GetLong32(IntPtr h,int n);
 [DllImport("user32.dll",CharSet=CharSet.Unicode,EntryPoint="SendMessageW")]static extern IntPtr TextMessage(IntPtr h,uint m,IntPtr w,string s);
 [DllImport("user32.dll",CharSet=CharSet.Unicode,EntryPoint="SendMessageW")]static extern IntPtr ReadMessage(IntPtr h,uint m,IntPtr w,StringBuilder s);
 [DllImport("user32.dll",EntryPoint="SendMessageW")]static extern IntPtr PointerMessage(IntPtr h,uint m,IntPtr w,IntPtr l);
 public static string ClassOf(IntPtr h){var s=new StringBuilder(128);GetClassName(h,s,128);return s.ToString();}
 public static long Style(IntPtr h){return IntPtr.Size==8?GetLongPtr(h,-16).ToInt64():GetLong32(h,-16);}
 public static string TextOf(IntPtr h){var s=new StringBuilder(4096);ReadMessage(h,13,(IntPtr)4096,s);return s.ToString();}
 public static bool SetFilename(IntPtr h,string value){return TextMessage(h,12,IntPtr.Zero,value)!=IntPtr.Zero;}
 public static void OpenOnce(IntPtr h){PointerMessage(h,245,IntPtr.Zero,IntPtr.Zero);}
}
'@
function OwnedByBrowser([IntPtr]$h){if([Pp142StandardPicker]::IsChild([IntPtr]69024,$h)){return $true};$seen=@{};for($i=0;$i -lt 16 -and $h -ne [IntPtr]::Zero;$i++){if([long]$h -eq 69024){return $true};if($seen.ContainsKey([long]$h)){break};$seen[[long]$h]=$true;$h=[Pp142StandardPicker]::GetWindow($h,4)};return $false}
function Frozen {
 if((Get-FileHash -LiteralPath $PreparedPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $PreparedSha256){throw 'Frozen accepted-v07 prepared changed'}
 $p=Get-Content -LiteralPath $PreparedPath -Raw -Encoding UTF8|ConvertFrom-Json
 if($p.issue -ne 142 -or $p.productionIssue -ne 141 -or $p.acceptedRevision -cne 'v07' -or $p.rootMediaAccepted -ne $true -or $p.rootMediaAcceptanceUrl -cne 'https://github.com/Pui-core/-/issues/141#issuecomment-6479380594' -or $p.channelId -cne 'UCZsCpCNJ-BBKEv7EMz1P73Q' -or $p.file -cne $FrozenFile -or $p.videoSha256 -cne $FrozenVideoSha256){throw 'Accepted-v07 issue/channel/file binding mismatch'}
 if((Get-FileHash -LiteralPath $FrozenFile -Algorithm SHA256).Hash.ToLowerInvariant() -cne $FrozenVideoSha256){throw 'Frozen accepted video changed'}
}
function Recheck {
 Guard;Frozen
 $bp=Get-Process -Id 34828;[uint32]$browserPid=0
 [void][Pp142FileContext]::GetWindowThreadProcessId([IntPtr]69024,[ref]$browserPid)
 if(-not [Pp142FileContext]::IsWindow([IntPtr]69024) -or $browserPid -ne 34828 -or $bp.SessionId -ne 1 -or [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1 -or $bp.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Pinned browser identity changed'}
 $tabsNow=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::TabItem))
 $selected=@($tabsNow|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,69024,4,-1253' -and $_.Current.Name -match 'YouTube Studio$'})
 if($selected.Count -ne 1 -or -not $selected[0].GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected){throw 'Pinned YouTube tab changed'}
 $docsNow=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Document))
 $docNow=@($docsNow|Where-Object{$_.Current.Name -match 'YouTube Studio$'})
 if($docNow.Count -ne 1){throw 'Unique YouTube document required'}
 $fresh=$docNow[0].FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition)
 $ownNow=@($fresh|Where-Object{try{$_.Current.ControlType -eq [Windows.Automation.ControlType]::Hyperlink -and $_.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value -ceq 'https://studio.youtube.com/channel/UCZsCpCNJ-BBKEv7EMz1P73Q'}catch{$false}})
 if($ownNow.Count -lt 1){throw 'Fresh own UC absent'}
 if(-not [Pp142StandardPicker]::IsWindow($Dialog) -or [Pp142StandardPicker]::ClassOf($Dialog) -cne '#32770' -or [Pp142StandardPicker]::TextOf($Dialog) -cne 'ファイルのアップロード' -or -not [Pp142StandardPicker]::IsWindowVisible($Dialog) -or -not [Pp142StandardPicker]::IsWindowEnabled($Dialog) -or -not (OwnedByBrowser $Dialog)){throw 'Pinned standard owned dialog changed'}
 [uint32]$dialogPid=0;[void][Pp142StandardPicker]::GetWindowThreadProcessId($Dialog,[ref]$dialogPid);$dp=Get-Process -Id $dialogPid
 if($dialogPid -ne 21108 -or $dp.SessionId -ne 1 -or $dp.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-28T20:13:43.7636882Z'){throw 'Dialog process/session/birth changed'}
 foreach($pair in @(@($Filename,'Edit',1148),@($Open,'Button',1))){$c=[IntPtr]$pair[0];[uint32]$controlPid=0;[void][Pp142StandardPicker]::GetWindowThreadProcessId($c,[ref]$controlPid)
  if(-not [Pp142StandardPicker]::IsChild($Dialog,$c) -or $controlPid -ne 21108 -or [Pp142StandardPicker]::ClassOf($c) -cne $pair[1] -or [Pp142StandardPicker]::GetDlgCtrlID($c) -ne $pair[2] -or -not [Pp142StandardPicker]::IsWindowVisible($c) -or -not [Pp142StandardPicker]::IsWindowEnabled($c)){throw 'Pinned Edit/Open control changed'}
 }
 if([long][Pp142StandardPicker]::GetDlgItem($Dialog,1) -ne [long]$Open -or [Pp142StandardPicker]::TextOf($Open) -cne '開く(&O)' -or ([Pp142StandardPicker]::Style($Filename) -band 0x800) -ne 0){throw 'Open identity or writable filename style changed'}
 Guard
}
Recheck
$current=[Pp142StandardPicker]::TextOf($Filename)
if($Action -eq 'read'){
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='read';dialogHwnd=[long]$Dialog;filenameHwnd=[long]$Filename;openHwnd=[long]$Open;filenameEmpty=($current.Length -eq 0);filenameMatchesAcceptedV07=($current -ceq $FrozenFile);filenameEsReadOnly=$false;intentExists=(Test-Path -LiteralPath $IntentPath);inputActions=0;fileAttachIntents=0;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0}|ConvertTo-Json -Compress;exit
}
if(Test-Path -LiteralPath $IntentPath){throw 'Existing attachment intent; inspect native upload outcome; no repeat'}
if($Action -eq 'set'){
 if($current.Length -gt 0 -and $current -cne $FrozenFile){throw 'Another filename was entered; preserved'}
 $changed=$current -cne $FrozenFile
 if($changed){Recheck;if([Pp142StandardPicker]::TextOf($Filename) -cne $current){throw 'Filename changed before write; preserved'};Guard;if(-not [Pp142StandardPicker]::SetFilename($Filename,$FrozenFile)){throw 'Standard WM_SETTEXT refused; no fallback/retry'}}
 Recheck
 if([Pp142StandardPicker]::TextOf($Filename) -cne $FrozenFile){throw 'WM_GETTEXT actual filename readback mismatch; no Open'}
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='set';method='explicit_standard_commondialog_WM_SETTEXT';changed=$changed;filenameReadbackExact=$true;videoSha256=$FrozenVideoSha256;fileAttachIntents=0;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0}|ConvertTo-Json -Compress;exit
}
if($Action -ne 'open'){throw 'Only read/set/open standard case actions are allowed'}
if($current -cne $FrozenFile){throw 'Exact accepted-v07 filename readback required'}
Recheck
if([Pp142StandardPicker]::TextOf($Filename) -cne $FrozenFile){throw 'Filename changed before intent'}
$record=[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;productionIssue=141;revision='v07';channelId='UCZsCpCNJ-BBKEv7EMz1P73Q';runId=$BoundRunId;expiresAt=$BoundExpiry;preparedSha256=$PreparedSha256;videoSha256=$FrozenVideoSha256;dialogHwnd=[long]$Dialog;dialogPid=21108;dialogBirthUtc='2026-10-28T20:13:43.7636882Z';filenameHwnd=[long]$Filename;openHwnd=[long]$Open;filenameReadbackExact=$true;method='explicit_standard_commondialog_BM_CLICK';fileAttachIntents=1;maxFileAttachIntents=1;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0;status='pending-native-upload-readback-no-retry'}
$bytes=[Text.UTF8Encoding]::new($false).GetBytes(($record|ConvertTo-Json -Depth 5));$stream=[IO.File]::Open($IntentPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
Recheck
if([Pp142StandardPicker]::TextOf($Filename) -cne $FrozenFile){throw 'Filename changed after intent; no Open/retry'}
Guard
[Pp142StandardPicker]::OpenOnce($Open)
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='open';nativeOpenSentOnce=$true;fileAttachIntents=1;maxFileAttachIntents=1;publicationIntents=0;osFocusActions=0;globalKeyMouseActions=0;videoSha256=$FrozenVideoSha256;intent=$IntentPath;status='Root must read new native video ID/progress; attachment result not yet confirmed'}|ConvertTo-Json -Compress
