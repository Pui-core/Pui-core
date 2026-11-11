param([Parameter(Mandatory=$true)][ValidateSet('set','open')][string]$Action,[Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry,[Parameter(Mandatory=$true)][long]$ExpectedDialog,[Parameter(Mandatory=$true)][long]$ExpectedFilenameHwnd,[Parameter(Mandatory=$true)][long]$ExpectedOpenHwnd,[Parameter(Mandatory=$true)][int]$ExpectedDialogPid,[Parameter(Mandatory=$true)][string]$ExpectedDialogBirthUtc)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$leasePaths=@('\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-youtube-ai128-20261027\claim.json','\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-youtube-20261026\claim.json','\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-truthorlie-quality129-20261027\claim.json','\\wsl.localhost\Ubuntu\home\pui\.claude\projectp-tiktok\publisher-nomination.json','\\wsl.localhost\Ubuntu\home\pui\.claude\projectp-tiktok\browser-lease.json')
function Guard {
 $now=[DateTime]::UtcNow
 if([string]::IsNullOrWhiteSpace($BoundRunId) -or $now -ge [DateTimeOffset]::Parse($BoundExpiry).UtcDateTime.AddSeconds(-25)){throw 'Run/expiry margin refused'}
 foreach($f in $leasePaths){$l=Get-Content -LiteralPath $f -Raw -Encoding UTF8|ConvertFrom-Json
  if($l.runId -cne $BoundRunId -or $l.expiresAt -cne $BoundExpiry -or $l.state -ne 'held' -or $l.currentService -ne 'youtube' -or $l.owner -ne 'root-quality129-old-reservations' -or $l.accountId -ne 'UCZsCpCNJ-BBKEv7EMz1P73Q'){throw 'Publisher lease changed'}
  $begin=[DateTimeOffset]::Parse($l.announcedWindow.startJst).UtcDateTime;$end=[DateTimeOffset]::Parse($l.announcedWindow.endJst).UtcDateTime
  if($now -lt $begin -or $now -ge $end -or $end -le $begin -or $end -gt [DateTimeOffset]::Parse($BoundExpiry).UtcDateTime -or ($end-$begin).TotalSeconds -gt 300){throw 'Announced window mismatch'}
 }
}
Guard
Add-Type -TypeDefinition @'
using System;using System.Text;using System.Runtime.InteropServices;
public class Pp134PickerAction {
 public delegate bool CB(IntPtr h,IntPtr l);
 [DllImport("user32.dll")]public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")]public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll",CharSet=CharSet.Unicode,EntryPoint="SendMessageW")]public static extern IntPtr SetText(IntPtr h,uint m,IntPtr w,string s);
 [DllImport("user32.dll",EntryPoint="SendMessageW")]public static extern IntPtr Click(IntPtr h,uint m,IntPtr w,IntPtr l);
 [DllImport("user32.dll")]public static extern bool IsWindow(IntPtr h);
 [DllImport("user32.dll")]public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")]public static extern bool IsWindowEnabled(IntPtr h);
 [DllImport("user32.dll")]public static extern bool IsChild(IntPtr p,IntPtr h);
 [DllImport("user32.dll")]public static extern bool EnumWindows(CB f,IntPtr l);
 [DllImport("user32.dll")]public static extern bool EnumChildWindows(IntPtr h,CB f,IntPtr l);
 [DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);
 [DllImport("user32.dll")]public static extern IntPtr GetWindow(IntPtr h,uint c);
 [DllImport("user32.dll")]public static extern IntPtr GetParent(IntPtr h);
 [DllImport("user32.dll")]public static extern int GetDlgCtrlID(IntPtr h);
 [DllImport("user32.dll")]public static extern IntPtr GetDlgItem(IntPtr h,int id);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]public static extern int GetClassName(IntPtr h,StringBuilder s,int n);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]public static extern int GetWindowText(IntPtr h,StringBuilder s,int n);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]public static extern IntPtr SendMessage(IntPtr h,uint m,IntPtr w,StringBuilder s);
}
'@
function ClassOf([IntPtr]$h){$s=[Text.StringBuilder]::new(128);[void][Pp134PickerAction]::GetClassName($h,$s,128);return $s.ToString()}
function TextOf([IntPtr]$h){$s=[Text.StringBuilder]::new(4096);[void][Pp134PickerAction]::SendMessage($h,13,[IntPtr]4096,$s);return $s.ToString()}
function OwnChain([IntPtr]$h){if([Pp134PickerAction]::IsChild([IntPtr]69024,$h)){return $true};$seen=@{};for($i=0;$i -lt 16 -and $h -ne [IntPtr]::Zero;$i++){if([long]$h -eq 69024){return $true};if($seen.ContainsKey([long]$h)){break};$seen[[long]$h]=$true;$h=[Pp134PickerAction]::GetWindow($h,4)};return $false}
$browser=Get-Process -Id 34828;[uint32]$browserPid=0
if(-not [Pp134PickerAction]::IsWindow([IntPtr]69024)){throw 'Pinned browser window absent'}
[void][Pp134PickerAction]::GetWindowThreadProcessId([IntPtr]69024,[ref]$browserPid)
if($browserPid -ne 34828 -or $browser.SessionId -ne 1 -or [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1 -or $browser.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Pinned browser identity changed'}
$logical=[Collections.Generic.HashSet[long]]::new()
$root=[Windows.Automation.AutomationElement]::FromHandle([IntPtr]69024)
$windows=$root.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Window))
foreach($w in $windows){$h=[IntPtr]$w.Current.NativeWindowHandle;if($h -ne [IntPtr]::Zero -and (ClassOf $h) -ceq '#32770'){[void]$logical.Add([long]$h)}}
$handles=[Collections.Generic.HashSet[long]]::new();foreach($h in $logical){[void]$handles.Add($h)}
[void][Pp134PickerAction]::EnumWindows({param($h,$l);if([Pp134PickerAction]::IsWindowVisible($h) -and (ClassOf $h) -ceq '#32770' -and (OwnChain $h)){[void]$handles.Add([long]$h)};return $true},[IntPtr]::Zero)
$rows=@()
foreach($number in $handles){$h=[IntPtr]$number
 if(-not [Pp134PickerAction]::IsWindowVisible($h) -or (-not (OwnChain $h) -and -not $logical.Contains($number))){continue}
 [uint32]$dialogPid=0;[void][Pp134PickerAction]::GetWindowThreadProcessId($h,[ref]$dialogPid);$proc=Get-Process -Id $dialogPid
 if($proc.SessionId -ne 1){continue}
 $title=[Text.StringBuilder]::new(200);[void][Pp134PickerAction]::GetWindowText($h,$title,200)
 if($title.ToString() -cnotin @('ファイルのアップロード','ファイルを開く','開く','File Upload','Open','Upload File')){continue}
 $edits=[Collections.Generic.List[long]]::new()
 [void][Pp134PickerAction]::EnumChildWindows($h,{param($c,$l);if((ClassOf $c) -ceq 'Edit' -and [Pp134PickerAction]::IsWindowVisible($c) -and [Pp134PickerAction]::GetDlgCtrlID($c) -eq 1148){$edits.Add([long]$c)};return $true},[IntPtr]::Zero)
 $fields=@();foreach($e in $edits){$fields+=[pscustomobject]@{hwnd=$e;id=1148;class='Edit';value=(TextOf ([IntPtr]$e));enabled=[Pp134PickerAction]::IsWindowEnabled([IntPtr]$e)}}
 $open=[Pp134PickerAction]::GetDlgItem($h,1);$button=$null
 if($open -ne [IntPtr]::Zero -and (ClassOf $open) -ceq 'Button' -and [Pp134PickerAction]::IsWindowVisible($open)){$button=[pscustomobject]@{hwnd=[long]$open;id=1;class='Button';enabled=[Pp134PickerAction]::IsWindowEnabled($open);name=(TextOf $open)}}
 $rows+=[pscustomobject]@{hwnd=$number;pid=$dialogPid;processBirthUtc=$proc.StartTime.ToUniversalTime().ToString('o');session=$proc.SessionId;class='#32770';title=$title.ToString();ownerChain=(OwnChain $h);logicalBrowserDescendant=$logical.Contains($number);filenameFields=$fields;open=$button}
}
Guard

$FrozenPath='F:\Videos\ProjectP-TruthOrLie-Short-2026-10-28\revision-05-real-round\videos\truthorlie-real-v9-bgm.mp4'
$FrozenHash='be3f9162f922dc3ab404eff56432b47dfa6f5e6bca72887a1e78aee19b7838da'
$Intent='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261028\youtube134-file-attach-intent.json'
if($rows.Count -ne 1 -or $rows[0].filenameFields.Count -ne 1 -or $null -eq $rows[0].open){throw 'Unique actionable owned dialog required'}
$observed=$rows[0]
if($ExpectedDialog -le 0 -or $ExpectedFilenameHwnd -le 0 -or $ExpectedOpenHwnd -le 0 -or $ExpectedDialogPid -le 0 -or $observed.hwnd -ne $ExpectedDialog -or $observed.pid -ne $ExpectedDialogPid -or $observed.processBirthUtc -cne $ExpectedDialogBirthUtc -or $observed.filenameFields[0].hwnd -ne $ExpectedFilenameHwnd -or $observed.open.hwnd -ne $ExpectedOpenHwnd){throw 'Fresh dialog/control binding differs from root probe; no input'}
function FrozenFile {if((Get-FileHash -LiteralPath $FrozenPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $FrozenHash){throw 'Frozen video changed'}}
function Recheck {
 Guard
 [uint32]$currentPid=0
 if(-not [Pp134PickerAction]::IsWindow([IntPtr]$ExpectedDialog) -or (ClassOf ([IntPtr]$ExpectedDialog)) -cne '#32770'){throw 'Dialog vanished/changed'}
 [void][Pp134PickerAction]::GetWindowThreadProcessId([IntPtr]$ExpectedDialog,[ref]$currentPid)
 $current=Get-Process -Id $currentPid
 if($currentPid -ne $ExpectedDialogPid -or $current.SessionId -ne 1 -or $current.StartTime.ToUniversalTime().ToString('o') -cne $ExpectedDialogBirthUtc){throw 'Dialog process identity changed'}
 if(-not (OwnChain ([IntPtr]$ExpectedDialog))){throw 'Current Win32 owner chain is required for input'}
 foreach($pair in @(@($ExpectedFilenameHwnd,'Edit',1148),@($ExpectedOpenHwnd,'Button',1))){$c=[IntPtr][long]$pair[0];[uint32]$cpid=0
  [void][Pp134PickerAction]::GetWindowThreadProcessId($c,[ref]$cpid)
  if(-not [Pp134PickerAction]::IsChild([IntPtr]$ExpectedDialog,$c) -or (ClassOf $c) -cne $pair[1] -or [Pp134PickerAction]::GetDlgCtrlID($c) -ne $pair[2] -or $cpid -ne $ExpectedDialogPid -or -not [Pp134PickerAction]::IsWindowVisible($c) -or -not [Pp134PickerAction]::IsWindowEnabled($c)){throw 'Pinned filename/Open control changed'}
 }
 if([long][Pp134PickerAction]::GetDlgItem([IntPtr]$ExpectedDialog,1) -ne $ExpectedOpenHwnd){throw 'Pinned Open ID1 changed'}
}
function Foreground {
 if([long][Pp134PickerAction]::GetForegroundWindow() -ne $ExpectedDialog){Guard;[void][Pp134PickerAction]::SetForegroundWindow([IntPtr]$ExpectedDialog)}
 if([long][Pp134PickerAction]::GetForegroundWindow() -ne $ExpectedDialog){throw 'Normal foreground refused; no force/input'}
}
Recheck;FrozenFile;Foreground;Recheck
if(Test-Path -LiteralPath $Intent){throw 'Existing attach intent; verify upload instead of repeating'}
if($Action -eq 'set'){
 $before=TextOf ([IntPtr]$ExpectedFilenameHwnd)
 if($before.Length -gt 0 -and $before -cne $FrozenPath){throw 'Filename already contains another value; preserved'}
 $method='already-exact'
 if($before -cne $FrozenPath){
  $edit=[Windows.Automation.AutomationElement]::FromHandle([IntPtr]$ExpectedFilenameHwnd);$pattern=$null
  if($edit.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern,[ref]$pattern)){
   if($pattern.Current.IsReadOnly){throw 'Filename is read-only'}
   Guard;$pattern.SetValue($FrozenPath);$method='ValuePattern'
  }else{Guard;[void][Pp134PickerAction]::SetText([IntPtr]$ExpectedFilenameHwnd,12,[IntPtr]::Zero,$FrozenPath);$method='WM_SETTEXT'}
 }
 Recheck
 if((TextOf ([IntPtr]$ExpectedFilenameHwnd)) -cne $FrozenPath){throw 'Filename actual readback mismatch; no Open'}
 FrozenFile
 [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action='set';dialog=$ExpectedDialog;filenameHwnd=$ExpectedFilenameHwnd;openHwnd=$ExpectedOpenHwnd;filenameReadbackExact=$true;method=$method;videoSha256=$FrozenHash;openIntents=0;publicationIntents=0}|ConvertTo-Json -Compress
 exit
}
if((TextOf ([IntPtr]$ExpectedFilenameHwnd)) -cne $FrozenPath){throw 'Exact filename readback required before Open'}
Guard;FrozenFile;Recheck
if([long][Pp134PickerAction]::GetForegroundWindow() -ne $ExpectedDialog){throw 'Foreground changed before intent; stopped'}
$record=[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=134;channelId='UCZsCpCNJ-BBKEv7EMz1P73Q';runId=$BoundRunId;expiresAt=$BoundExpiry;dialogHwnd=$ExpectedDialog;dialogPid=$ExpectedDialogPid;dialogBirthUtc=$ExpectedDialogBirthUtc;filenameHwnd=$ExpectedFilenameHwnd;openHwnd=$ExpectedOpenHwnd;filenameReadbackExact=$true;videoSha256=$FrozenHash;fileAttachIntent=1;maxFileAttachIntent=1;publicationIntents=0;status='pending-native-upload-readback'}
$bytes=[Text.UTF8Encoding]::new($false).GetBytes(($record|ConvertTo-Json -Depth 4))
$stream=[IO.File]::Open($Intent,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
Guard;Recheck;FrozenFile
if((TextOf ([IntPtr]$ExpectedFilenameHwnd)) -cne $FrozenPath -or [long][Pp134PickerAction]::GetForegroundWindow() -ne $ExpectedDialog){throw 'Readback/foreground changed after intent; no retry'}
[void][Pp134PickerAction]::Click([IntPtr]$ExpectedOpenHwnd,245,[IntPtr]::Zero,[IntPtr]::Zero)
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');action='open';nativeOpenSentOnce=$true;fileAttachIntent=1;publicationIntents=0;status='verify-native-upload-readback';videoSha256=$FrozenHash}|ConvertTo-Json -Compress
