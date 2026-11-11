param([Parameter(Mandatory=$true)][string]$BoundRunId,[Parameter(Mandatory=$true)][string]$BoundExpiry)
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
public class Pp142PickerProbe {
 public delegate bool CB(IntPtr h,IntPtr l);
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
function ClassOf([IntPtr]$h){$s=[Text.StringBuilder]::new(128);[void][Pp142PickerProbe]::GetClassName($h,$s,128);return $s.ToString()}
function TextOf([IntPtr]$h){$s=[Text.StringBuilder]::new(4096);[void][Pp142PickerProbe]::SendMessage($h,13,[IntPtr]4096,$s);return $s.ToString()}
function OwnChain([IntPtr]$h){if([Pp142PickerProbe]::IsChild([IntPtr]69024,$h)){return $true};$seen=@{};for($i=0;$i -lt 16 -and $h -ne [IntPtr]::Zero;$i++){if([long]$h -eq 69024){return $true};if($seen.ContainsKey([long]$h)){break};$seen[[long]$h]=$true;$h=[Pp142PickerProbe]::GetWindow($h,4)};return $false}
$browser=Get-Process -Id 34828;[uint32]$browserPid=0
if(-not [Pp142PickerProbe]::IsWindow([IntPtr]69024)){throw 'Pinned browser window absent'}
[void][Pp142PickerProbe]::GetWindowThreadProcessId([IntPtr]69024,[ref]$browserPid)
if($browserPid -ne 34828 -or $browser.SessionId -ne 1 -or [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1 -or $browser.StartTime.ToUniversalTime().ToString('o') -cne '2026-10-27T17:54:34.0063169Z'){throw 'Pinned browser identity changed'}
$p=Get-Process -Id 34828;[uint32]$wpid=0
if(-not [Pp142PickerProbe]::IsWindow([IntPtr]69024)){throw 'Pinned window missing'}
[void][Pp142PickerProbe]::GetWindowThreadProcessId([IntPtr]69024,[ref]$wpid)
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



$logical=[Collections.Generic.HashSet[long]]::new()
$root=[Windows.Automation.AutomationElement]::FromHandle([IntPtr]69024)
$windows=$root.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Window))
foreach($w in $windows){$h=[IntPtr]$w.Current.NativeWindowHandle;if($h -ne [IntPtr]::Zero -and (ClassOf $h) -ceq '#32770'){[void]$logical.Add([long]$h)}}
$handles=[Collections.Generic.HashSet[long]]::new();foreach($h in $logical){[void]$handles.Add($h)}
[void][Pp142PickerProbe]::EnumWindows({param($h,$l);if([Pp142PickerProbe]::IsWindowVisible($h) -and (ClassOf $h) -ceq '#32770' -and (OwnChain $h)){[void]$handles.Add([long]$h)};return $true},[IntPtr]::Zero)
$rows=@()
foreach($number in $handles){$h=[IntPtr]$number
 if(-not [Pp142PickerProbe]::IsWindowVisible($h) -or (-not (OwnChain $h) -and -not $logical.Contains($number))){continue}
 [uint32]$dialogPid=0;[void][Pp142PickerProbe]::GetWindowThreadProcessId($h,[ref]$dialogPid);$proc=Get-Process -Id $dialogPid
 if($proc.SessionId -ne 1){continue}
 $title=[Text.StringBuilder]::new(200);[void][Pp142PickerProbe]::GetWindowText($h,$title,200)
 if($title.ToString() -cnotin @('ファイルのアップロード','ファイルを開く','開く','File Upload','Open','Upload File')){continue}
 $edits=[Collections.Generic.List[long]]::new()
 [void][Pp142PickerProbe]::EnumChildWindows($h,{param($c,$l);if((ClassOf $c) -ceq 'Edit' -and [Pp142PickerProbe]::IsWindowVisible($c) -and [Pp142PickerProbe]::GetDlgCtrlID($c) -eq 1148){$edits.Add([long]$c)};return $true},[IntPtr]::Zero)
 $fields=@();foreach($e in $edits){
  $ae=[Windows.Automation.AutomationElement]::FromHandle([IntPtr]$e);$vp=$null;$valueSupported=$ae.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern,[ref]$vp)
  $ancestors=@();$parent=[Pp142PickerProbe]::GetParent([IntPtr]$e)
  for($level=0;$level -lt 3 -and $parent -ne [IntPtr]::Zero -and $parent -ne $h;$level++){
   $pa=[Windows.Automation.AutomationElement]::FromHandle($parent);$pv=$null;$supports=$pa.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern,[ref]$pv)
   $ancestors+=[pscustomobject]@{hwnd=[long]$parent;class=(ClassOf $parent);id=[Pp142PickerProbe]::GetDlgCtrlID($parent);uiaType=$pa.Current.ControlType.ProgrammaticName;valuePattern=$supports;patterns=($pa.GetSupportedPatterns().ProgrammaticName -join ',')}
   $parent=[Pp142PickerProbe]::GetParent($parent)
  }
  $fields+=[pscustomobject]@{hwnd=$e;id=1148;class='Edit';value=(TextOf ([IntPtr]$e));enabled=[Pp142PickerProbe]::IsWindowEnabled([IntPtr]$e);uiaType=$ae.Current.ControlType.ProgrammaticName;valuePattern=$valueSupported;readOnly=if($valueSupported){$vp.Current.IsReadOnly}else{$null};patterns=($ae.GetSupportedPatterns().ProgrammaticName -join ',');filenameHostAncestors=$ancestors}
 }
 $open=[Pp142PickerProbe]::GetDlgItem($h,1);$button=$null
 if($open -ne [IntPtr]::Zero -and (ClassOf $open) -ceq 'Button' -and [Pp142PickerProbe]::IsWindowVisible($open)){$button=[pscustomobject]@{hwnd=[long]$open;id=1;class='Button';enabled=[Pp142PickerProbe]::IsWindowEnabled($open);name=(TextOf $open)}}
 $rows+=[pscustomobject]@{hwnd=$number;pid=$dialogPid;processBirthUtc=$proc.StartTime.ToUniversalTime().ToString('o');session=$proc.SessionId;class='#32770';title=$title.ToString();ownerChain=(OwnChain $h);logicalBrowserDescendant=$logical.Contains($number);filenameFields=$fields;open=$button}
}
Guard
[pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');issue=142;action='probe';browserHwnd=69024;browserPid=34828;dialogCount=$rows.Count;uniqueActionable=($rows.Count -eq 1 -and $rows[0].filenameFields.Count -eq 1 -and $null -ne $rows[0].open);dialogs=$rows;inputActions=0;directoryEnumeration=$false}|ConvertTo-Json -Depth 7 -Compress
