param(
    [ValidateSet('openNewWindow')][string]$Action = 'inventory',
    [Parameter(Mandatory=$true)][string]$BoundRunId,
    [Parameter(Mandatory=$true)][string]$BoundExpiry,
    [Parameter(Mandatory=$true)][string]$BoundOwner,
    [long]$ExpectedWindowHandle = 0,
    [string]$ExpectedTabRuntimeId = '',
    [string]$ExpectedDocumentRuntimeId = ''
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$clock = [Diagnostics.Stopwatch]::StartNew()
$browserPid = 34828
$browserSession = 1
$browserBirth = '2026-10-27T17:54:34.0063169Z'
$protectedHwnd = 69024L
$protectedTab = '42,69024,4,-68'
$asset = 'F:\Videos\ProjectP-TruthOrLie-Short-2026-10-28\model-motion-20261029\videos\truthorlie-real-v10-voice.mp4'
$assetSha = 'e683ad00bad973a09456fd49895f8eddcde884be9c37f2ae5dca8bbaa4935592'
$leasePaths = @(
    '\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-youtube-ai128-20261027\claim.json',
    '\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-youtube-20261026\claim.json',
    '\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-truthorlie-quality129-20261027\claim.json',
    '\\wsl.localhost\Ubuntu\home\pui\.claude\projectp-tiktok\publisher-nomination.json',
    '\\wsl.localhost\Ubuntu\home\pui\.claude\projectp-tiktok\browser-lease.json'
)
function Guard {
    if ($clock.Elapsed.TotalSeconds -gt 15) { throw 'Finite read deadline reached' }
    $now = [DateTimeOffset]::UtcNow
    $expiry = [DateTimeOffset]::Parse($BoundExpiry)
    if ($now -ge $expiry.AddSeconds(-10)) { throw 'Lease expiry margin reached' }
    foreach ($path in $leasePaths) {
        $l = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($l.runId -cne $BoundRunId -or $l.expiresAt -cne $BoundExpiry -or
            $l.owner -cne $BoundOwner -or $l.state -cne 'held' -or
            $l.currentService -cne 'tiktok' -or $l.accountId -cne 'prop_pui') {
            throw 'Five own TikTok lease aliases differ'
        }
        $begin = [DateTimeOffset]::Parse($l.announcedWindow.startJst)
        $end = [DateTimeOffset]::Parse($l.announcedWindow.endJst)
        if ($end -le $begin -or ($end-$begin).TotalSeconds -gt 300 -or
            $end -gt $expiry -or $now -lt $begin -or $now -ge $end) {
            throw 'Outside announced finite window'
        }
    }
    $p = Get-Process -Id $browserPid
    if ($p.ProcessName -cne 'firefox' -or $p.SessionId -ne $browserSession -or
        $p.StartTime.ToUniversalTime().ToString('o') -cne $browserBirth -or
        [Diagnostics.Process]::GetCurrentProcess().SessionId -ne $browserSession) {
        throw 'Pinned Firefox PID, session or birth differs'
    }
}
Guard
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class Pp144ReadWindows {
    private delegate bool EnumProc(IntPtr h, IntPtr l);
    [DllImport("user32.dll")] private static extern bool EnumWindows(EnumProc p, IntPtr l);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] private static extern int GetClassName(IntPtr h, StringBuilder b, int n);
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
    public static long[] ForPid(uint pid) {
        var handles = new List<long>();
        EnumWindows(delegate(IntPtr h, IntPtr l) {
            uint owner; GetWindowThreadProcessId(h, out owner);
            if (owner != pid || !IsWindowVisible(h)) return true;
            var name = new StringBuilder(80); GetClassName(h, name, name.Capacity);
            if (name.ToString() == "MozillaWindowClass") handles.Add(h.ToInt64());
            return handles.Count <= 8;
        }, IntPtr.Zero);
        return handles.ToArray();
    }
}
'@
function Assert-Window([long]$handle) {
    Guard
    [uint32]$owner = 0
    if (-not [Pp144ReadWindows]::IsWindow([IntPtr]$handle)) { throw 'Observed window disappeared' }
    [void][Pp144ReadWindows]::GetWindowThreadProcessId([IntPtr]$handle, [ref]$owner)
    if ($owner -ne $browserPid) { throw 'Observed window owner differs' }
}
function Elements-OfType($root, $type) {
    Guard
    $a = $root.FindAll([Windows.Automation.TreeScope]::Descendants,
        [Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty, $type))
    if ($a.Count -gt 80) { throw 'Bounded control count exceeded' }
    return $a
}
function Read-Tabs($root) {
    $top = $root.Current.BoundingRectangle.Top
    $rows = @()
    foreach ($t in (Elements-OfType $root ([Windows.Automation.ControlType]::TabItem))) {
        $b = $t.Current.BoundingRectangle
        if ($b.IsEmpty -or $b.Top -lt $top -or $b.Bottom -gt ($top+140)) { continue }
        $rows += [pscustomobject]@{
            rid=($t.GetRuntimeId() -join ',')
            selected=$t.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected
            studioName=($t.Current.Name -cmatch '^TikTok Studio(?:$|\s)')
        }
    }
    if ($rows.Count -gt 20) { throw 'Bounded native tab count exceeded' }
    return $rows
}
Assert-Window $protectedHwnd
Guard
$beforePath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261028\inventory-before144.json'
if((Get-FileHash -LiteralPath $beforePath -Algorithm SHA256).Hash.ToLowerInvariant() -cne '3e91903a167997e8babe44a77370ce005fc9516f1ea3166b66299be2db1a0df5'){throw 'Beforeinventory changed'}
$beforeSnapshot=Get-Content -LiteralPath $beforePath -Raw -Encoding UTF8|ConvertFrom-Json
if($beforeSnapshot.issue -ne 144 -or $beforeSnapshot.action -cne 'inventory' -or $beforeSnapshot.mutations -ne 0){throw 'Wrong beforeticket'}
$expected=@($beforeSnapshot.windows|ForEach-Object{[long]$_.hwnd}|Sort-Object);$current=@([Pp144ReadWindows]::ForPid([uint32]$browserPid)|Sort-Object)
if(($current -join ',') -cne ($expected -join ',') -or $current -notcontains $protectedHwnd){throw 'Windowset changed beforelaunch; no automatic retry'}
if((Get-FileHash -LiteralPath $asset -Algorithm SHA256).Hash.ToLowerInvariant() -cne $assetSha){throw 'Acceptedv10 asset changed'}
$firefoxExe=(Get-Process -Id $browserPid).Path;if([IO.Path]::GetFileName($firefoxExe) -cne 'firefox.exe' -or -not (Test-Path -LiteralPath $firefoxExe)){throw 'Observed sameFirefox executable unavailable'}
$intent='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp144-live\new-window-intent.json'
$record=[pscustomobject]@{issue=144;at=[DateTime]::UtcNow.ToString('o');beforeSha256='3e91903a167997e8babe44a77370ce005fc9516f1ea3166b66299be2db1a0df5';expectedHandles=$expected;browserPid=$browserPid;birth=$browserBirth;exe=$firefoxExe;url='https://www.tiktok.com/tiktokstudio/upload';normalCliNewWindowIntents=1;protectedHwnd=$protectedHwnd;oldTabsTouched=0;publicationIntents=0}
$bytes=[Text.UTF8Encoding]::new($false).GetBytes(($record|ConvertTo-Json -Depth 4));$stream=[IO.File]::Open($intent,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None);try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
Guard;$launchProcess=Start-Process -FilePath $firefoxExe -ArgumentList @('--new-window','https://www.tiktok.com/tiktokstudio/upload') -PassThru
[pscustomobject]@{issue=144;at=[DateTime]::UtcNow.ToString('o');action='normalFirefoxNewWindow';intentSaved=$true;launcherPid=$launchProcess.Id;protectedHwnd=$protectedHwnd;oldTabsTouched=0;ownAccountVerified=$false;publicationIntents=0;status='Inspect fresh windowset; do not repeat CLI if outcomeunknown'}|ConvertTo-Json -Compress
