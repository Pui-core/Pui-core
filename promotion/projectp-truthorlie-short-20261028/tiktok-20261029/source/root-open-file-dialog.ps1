param(
    [ValidateSet('inventory','inspect')][string]$Action = 'inventory',
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
$handles = @([Pp144ReadWindows]::ForPid([uint32]$browserPid))
if ($handles.Count -gt 8) { throw 'Bounded own window count exceeded' }
if ($Action -eq 'inventory') {
    $rows = @()
    foreach ($handle in $handles) {
        Assert-Window $handle
        if ($handle -eq $protectedHwnd) {
            $rows += [pscustomobject]@{hwnd=$handle;protected=$true;childrenRead=$false}
            continue
        }
        $r = [Windows.Automation.AutomationElement]::FromHandle([IntPtr]$handle)
        $docs = @()
        foreach ($d in (Elements-OfType $r ([Windows.Automation.ControlType]::Document))) {
            $docs += [pscustomobject]@{rid=($d.GetRuntimeId() -join ',');studioName=($d.Current.Name -ceq 'TikTok Studio');offscreen=$d.Current.IsOffscreen}
        }
        $rows += [pscustomobject]@{hwnd=$handle;protected=$false;tabs=@(Read-Tabs $r);documents=$docs;documentContentsRead=$false}
    }
    Guard
    [pscustomobject]@{issue=144;action=$Action;at=[DateTimeOffset]::UtcNow.ToString('o');pid=$browserPid;session=$browserSession;birth=$browserBirth;windows=$rows;ownAccountVerified=$false;mutations=0} | ConvertTo-Json -Depth 7 -Compress
    exit
}
if ($ExpectedWindowHandle -eq 0 -or $ExpectedWindowHandle -eq $protectedHwnd -or
    $handles -notcontains $ExpectedWindowHandle -or $ExpectedTabRuntimeId -ceq $protectedTab -or
    $ExpectedTabRuntimeId -notmatch '^\d+(,-?\d+){2,8}$' -or
    $ExpectedDocumentRuntimeId -notmatch '^\d+(,-?\d+){2,8}$') {
    throw 'Only freshly observed separate window, tab and document allowed'
}
Assert-Window $ExpectedWindowHandle
$root = [Windows.Automation.AutomationElement]::FromHandle([IntPtr]$ExpectedWindowHandle)
$selected = @((Read-Tabs $root) | Where-Object {$_.selected})
if ($selected.Count -ne 1 -or $selected[0].rid -cne $ExpectedTabRuntimeId -or -not $selected[0].studioName) {
    throw 'Selected native TikTok tab differs'
}
$docs = @((Elements-OfType $root ([Windows.Automation.ControlType]::Document)) | Where-Object {
    -not $_.Current.IsOffscreen -and $_.Current.Name -ceq 'TikTok Studio'
})
if ($docs.Count -ne 1 -or ($docs[0].GetRuntimeId() -join ',') -cne $ExpectedDocumentRuntimeId) {
    throw 'Unique freshly observed TikTok document differs'
}
$urlHits = @()
$top = $root.Current.BoundingRectangle.Top
foreach ($type in @([Windows.Automation.ControlType]::ComboBox,[Windows.Automation.ControlType]::Edit)) {
    foreach ($e in (Elements-OfType $root $type)) {
        $b = $e.Current.BoundingRectangle
        if ($b.IsEmpty -or $b.Top -lt $top -or $b.Bottom -gt ($top+140) -or $e.Current.IsOffscreen) { continue }
        try { $v = $e.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value } catch { continue }
        if($v.StartsWith('www.tiktok.com/')){$v='https://'+$v};$u=$null;if([Uri]::TryCreate($v,[UriKind]::Absolute,[ref]$u) -and $u.Scheme -ceq 'https' -and $u.Host -ceq 'www.tiktok.com' -and $u.AbsolutePath -ceq '/tiktokstudio/upload'){$keys=@($u.Query.TrimStart('?').Split('&')|Where-Object{$_}|ForEach-Object{$_.Split('=')[0]});if($keys.Count -le 2 -and @($keys|Where-Object{$_ -cnotin @('from','tab')}).Count -eq 0){$urlHits+='https://www.tiktok.com/tiktokstudio/upload'}}
    }
}
if (@($urlHits | Select-Object -Unique).Count -ne 1) { throw 'Exact official upload origin/address absent' }
function CurrentOwn144 {$list=@();foreach($e in (Elements-OfType $docs[0] ([Windows.Automation.ControlType]::Hyperlink))){try{$v=$e.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value}catch{continue};if($v -ceq 'https://www.tiktok.com/@prop_pui' -and -not $e.Current.IsOffscreen){$list+=$e}};return $list}
$ownLinks=@(CurrentOwn144);$expansions=0
if($ownLinks.Count -ne 1){$avatar=@((Elements-OfType $docs[0] ([Windows.Automation.ControlType]::Button))|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,51187480,4,-18818' -and $_.Current.Name -ceq '' -and $_.Current.IsEnabled -and -not $_.Current.IsOffscreen});if($avatar.Count -ne 1){throw 'Observed avatar changed'};$ec=$avatar[0].GetCurrentPattern([Windows.Automation.ExpandCollapsePattern]::Pattern);if($ec.Current.ExpandCollapseState.ToString() -cne 'Collapsed'){throw 'Unexpected avatar state'};Guard;$ec.Expand();$expansions=1;for($i=0;$i -lt 12;$i++){Start-Sleep -Milliseconds 100;Guard;$ownLinks=@(CurrentOwn144);if($ownLinks.Count -eq 1){break}}}
if($ownLinks.Count -ne 1){throw 'Exact ownhref unavailable; no filedialog'}
if((Get-FileHash -LiteralPath $asset -Algorithm SHA256).Hash.ToLowerInvariant() -cne $assetSha){throw 'Frozenv10 changed'}
$select=@((Elements-OfType $docs[0] ([Windows.Automation.ControlType]::Button))|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,51187480,4,-18574' -and $_.Current.Name -ceq '動画を選択' -and $_.Current.IsEnabled -and -not $_.Current.IsOffscreen});if($select.Count -ne 1){throw 'Observed videoSelect changed'}
$ticket='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp144-live\own-before-filepicker.json';$record=[pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');hwnd=$ExpectedWindowHandle;tabRid=$ExpectedTabRuntimeId;documentRid=$ExpectedDocumentRuntimeId;pid=$browserPid;session=$browserSession;birth=$browserBirth;accountId='prop_pui';ownAccountVerified=$true;profileHref='https://www.tiktok.com/@prop_pui';profileLinkRuntimeId=($ownLinks[0].GetRuntimeId()-join ',');officialPath='/tiktokstudio/upload';allowedQueryKeys=@('from','tab');sourceFile=$asset;sourceVideoSha256=$assetSha;fileSelectRuntimeId='42,51187480,4,-18574';fileAttachIntents=0;publicationIntents=0}
$bytes=[Text.UTF8Encoding]::new($false).GetBytes(($record|ConvertTo-Json -Depth 5));$stream=[IO.File]::Open($ticket,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None);try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
Guard;$ownLinks=@(CurrentOwn144);if($ownLinks.Count -ne 1){throw 'Ownchanged before fileSelect'};$select[0].GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
[pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');action='selectFileDialog';fileSelectInvokeCalls=1;profileExpansionCalls=$expansions;ownAccountVerifiedBefore=$true;fileAttachIntents=0;publicationIntents=0;status='Inspect owned standard filepicker before anyfilename or Open'}|ConvertTo-Json -Compress
