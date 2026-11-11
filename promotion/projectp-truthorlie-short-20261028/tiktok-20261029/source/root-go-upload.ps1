param(
    [Parameter(Mandatory=$true)][ValidateSet('goUpload')][string]$Action,
    [Parameter(Mandatory=$true)][string]$BoundRunId,
    [Parameter(Mandatory=$true)][string]$BoundExpiry,
    [Parameter(Mandatory=$true)][string]$BoundOwner,
    [string]$ExpectedCatalogDocumentRuntimeId = ''
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$clock = [Diagnostics.Stopwatch]::StartNew()
$browserPid = 34828
$browserBirth = '2026-10-27T17:54:34.0063169Z'
$targetHwnd = 51187480L
$tabRid = '42,51187480,4,-17035'
$uploadDocRid = '42,51187480,4,-18262'
$musicButtonRid = '42,51187480,4,-18284'
$musicName = 'ロイヤリティフリーの楽曲'
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
    if ($clock.Elapsed.TotalSeconds -gt 15) { throw 'Finite command deadline reached' }
    $now = [DateTimeOffset]::UtcNow
    $expiry = [DateTimeOffset]::Parse($BoundExpiry)
    if ($now -ge $expiry.AddSeconds(-10)) { throw 'Lease margin reached' }
    foreach ($path in $leasePaths) {
        $l = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($l.runId -cne $BoundRunId -or $l.expiresAt -cne $BoundExpiry -or $l.owner -cne $BoundOwner -or
            $l.state -cne 'held' -or $l.currentService -cne 'tiktok' -or $l.accountId -cne 'prop_pui') { throw 'Five own aliases differ' }
        $begin = [DateTimeOffset]::Parse($l.announcedWindow.startJst)
        $end = [DateTimeOffset]::Parse($l.announcedWindow.endJst)
        if ($end -le $begin -or ($end-$begin).TotalSeconds -gt 300 -or $end -gt $expiry -or $now -lt $begin -or $now -ge $end) { throw 'Outside finite window' }
    }
    $p = Get-Process -Id $browserPid
    if ($p.ProcessName -cne 'firefox' -or $p.SessionId -ne 1 -or
        $p.StartTime.ToUniversalTime().ToString('o') -cne $browserBirth -or
        [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1) { throw 'Own Firefox identity differs' }
}
Guard
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class Pp144MusicIdentity {
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
}
'@
function Assert-Window {
    Guard
    foreach ($h in @(69024L,$targetHwnd)) {
        [uint32]$owner = 0
        if (-not [Pp144MusicIdentity]::IsWindow([IntPtr]$h)) { throw 'Pinned or protected window missing' }
        [void][Pp144MusicIdentity]::GetWindowThreadProcessId([IntPtr]$h,[ref]$owner)
        if ($owner -ne $browserPid) { throw 'Pinned window owner differs' }
    }
}
function Typed($root, $type) {
    Guard
    $a = $root.FindAll([Windows.Automation.TreeScope]::Descendants,
        [Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,$type))
    if ($a.Count -gt 200) { throw 'Bounded typed control count exceeded' }
    return $a
}
function Fresh-Context([bool]$catalog) {
    Assert-Window
    $r = [Windows.Automation.AutomationElement]::FromHandle([IntPtr]$targetHwnd)
    $tab = @((Typed $r ([Windows.Automation.ControlType]::TabItem)) | Where-Object {
        ($_.GetRuntimeId() -join ',') -ceq $tabRid -and $_.Current.Name -cmatch '^TikTok Studio(?:$|\s)' -and
        $_.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected
    })
    if ($tab.Count -ne 1) { throw 'Exact new native tab not selected' }
    $expectedRid = $uploadDocRid
    $expectedUrl = 'https://www.tiktok.com/tiktokstudio/upload'
    if ($catalog) {
        if ($ExpectedCatalogDocumentRuntimeId -notmatch '^\d+(,-?\d+){2,8}$') { throw 'Observed catalog document RID required' }
        $expectedRid = $ExpectedCatalogDocumentRuntimeId
        $expectedUrl = 'https://www.tiktok.com/tiktokstudio/sound-library'
    }
    $docs = @((Typed $r ([Windows.Automation.ControlType]::Document)) | Where-Object {
        -not $_.Current.IsOffscreen -and $_.Current.Name -ceq 'TikTok Studio'
    })
    if ($docs.Count -ne 1 -or ($docs[0].GetRuntimeId() -join ',') -cne $expectedRid) { throw 'Fresh unique document differs' }
    $top = $r.Current.BoundingRectangle.Top
    $urlHits = @()
    foreach ($type in @([Windows.Automation.ControlType]::ComboBox,[Windows.Automation.ControlType]::Edit)) {
        foreach ($e in (Typed $r $type)) {
            $b = $e.Current.BoundingRectangle
            if ($b.IsEmpty -or $e.Current.IsOffscreen -or $b.Top -lt $top -or $b.Bottom -gt ($top+140)) { continue }
            try { $v = $e.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value } catch { continue }
            if ($v -ceq $expectedUrl -or $v -ceq $expectedUrl.Substring(8)) { $urlHits += $v }
        }
    }
    if (@($urlHits | Select-Object -Unique).Count -ne 1) { throw 'Exact official address absent' }
    $own = @()
    foreach ($e in (Typed $docs[0] ([Windows.Automation.ControlType]::Hyperlink))) {
        if ($e.Current.IsOffscreen) { continue }
        try { $href = $e.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value } catch { continue }
        if ($href -ceq 'https://www.tiktok.com/@prop_pui') { $own += $e }
    }
    if (-not $catalog -and $own.Count -lt 1) { throw 'Exact visible own href required on upload; no marker exception' }
    if ((Get-FileHash -LiteralPath $asset -Algorithm SHA256).Hash.ToLowerInvariant() -cne $assetSha) { throw 'Frozen v10 differs' }
    if ($catalog) {
        $header = @((Typed $docs[0] ([Windows.Automation.ControlType]::Text)) | Where-Object {$_.Current.Name -ceq $musicName -and -not $_.Current.IsOffscreen})
        if ($header.Count -ne 1) { throw 'Exact visible public catalog header absent' }
    }
    Guard
    return [pscustomobject]@{root=$r;doc=$docs[0];rid=$expectedRid;url=$expectedUrl;own=($own.Count -gt 0)}
}
function Music-Button($context) {
    $hits = @((Typed $context.doc ([Windows.Automation.ControlType]::Button)) | Where-Object {
        ($_.GetRuntimeId() -join ',') -ceq $musicButtonRid -and $_.Current.Name -ceq $musicName -and
        $_.Current.IsEnabled -and -not $_.Current.IsOffscreen -and -not $_.Current.BoundingRectangle.IsEmpty
    })
    if ($hits.Count -ne 1) { throw 'Fresh exact music navigation button absent' }
    $null = $hits[0].GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern)
    return $hits[0]
}
$context=Fresh-Context $true;$expansions=0
if(-not $context.own){$avatar=@((Typed $context.doc ([Windows.Automation.ControlType]::Button))|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,51187480,4,-18818' -and $_.Current.Name -ceq '' -and $_.Current.IsEnabled -and -not $_.Current.IsOffscreen});if($avatar.Count -ne 1){throw 'Observed avatar changed'};$ec=$avatar[0].GetCurrentPattern([Windows.Automation.ExpandCollapsePattern]::Pattern);if($ec.Current.ExpandCollapseState.ToString() -cne 'Collapsed'){throw 'Unexpected profilemenustate'};Guard;$ec.Expand();$expansions=1;for($i=0;$i -lt 12;$i++){Start-Sleep -Milliseconds 100;$context=Fresh-Context $true;if($context.own){break}}}
if(-not $context.own){throw 'Exact ownhrefstillabsent; no uploadview navigation'}
$buttons=@((Typed $context.doc ([Windows.Automation.ControlType]::Button))|Where-Object{($_.GetRuntimeId()-join ',') -ceq '42,51187480,4,-18827' -and $_.Current.Name -ceq 'アップロード' -and $_.Current.IsEnabled -and -not $_.Current.IsOffscreen});if($buttons.Count -ne 1){throw 'Observed uploadnav changed'}
$intent='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp144-live\upload-nav-intent.json';$bytes=[Text.UTF8Encoding]::new($false).GetBytes(([pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');hwnd=$targetHwnd;tabRid=$tabRid;from='sound-library';to='upload';ownAccount='prop_pui';ownVerifiedBefore=$true;navigationIntents=1;publicationIntents=0;fileAttachIntents=0}|ConvertTo-Json));$stream=[IO.File]::Open($intent,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None);try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
$context=Fresh-Context $true;if(-not $context.own){throw 'Ownchangedbefore navigation'};Guard;$buttons[0].GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
[pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');action='goUpload';navigationInvokeCalls=1;profileExpansionCalls=$expansions;ownVerifiedBeforeInvoke=$true;fileAttachIntents=0;publicationIntents=0}|ConvertTo-Json -Compress
