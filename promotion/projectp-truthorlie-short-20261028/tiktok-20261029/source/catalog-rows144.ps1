param(
    [Parameter(Mandatory=$true)][ValidateSet('readCatalog','scrollCatalog')][string]$Action,
    [Parameter(Mandatory=$true)][string]$BoundRunId,
    [Parameter(Mandatory=$true)][string]$BoundExpiry,
    [Parameter(Mandatory=$true)][string]$BoundOwner,
    [string]$ExpectedCatalogDocumentRuntimeId = '42,51187480,4,-18262'
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
public static class Pp144CatalogIdentity {
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
}
'@
function Assert-Window {
    Guard
    foreach ($h in @(69024L,$targetHwnd)) {
        [uint32]$owner = 0
        if (-not [Pp144CatalogIdentity]::IsWindow([IntPtr]$h)) { throw 'Pinned or protected window missing' }
        [void][Pp144CatalogIdentity]::GetWindowThreadProcessId([IntPtr]$h,[ref]$owner)
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
function Song-Tab($context) {
    $hits = @((Typed $context.doc ([Windows.Automation.ControlType]::TabItem)) | Where-Object {
        ($_.GetRuntimeId() -join ',') -ceq '42,51187480,4,-18703' -and $_.Current.Name -ceq '曲' -and $_.Current.IsEnabled
    })
    if ($hits.Count -ne 1) { throw 'Observed song table tab differs' }
    return $hits[0]
}
if ($Action -eq 'scrollCatalog') {
    $context = Fresh-Context $true
    $tab = Song-Tab $context
    $scroll = $tab.GetCurrentPattern([Windows.Automation.ScrollItemPattern]::Pattern)
    Guard
    $scroll.ScrollIntoView()
    $fresh = Fresh-Context $true
    $target = Song-Tab $fresh
    Guard
    [pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');action=$Action;scrollIntoViewCalls=1;targetRid='42,51187480,4,-18703';visibleAfter=(-not $target.Current.IsOffscreen);ownAccountVerified=$fresh.own;publicationIntents=0;posted=$false} | ConvertTo-Json -Compress
    exit
}
$context = Fresh-Context $true
$rows = @()
$types = @([Windows.Automation.ControlType]::Button,[Windows.Automation.ControlType]::Text,
    [Windows.Automation.ControlType]::ListItem,[Windows.Automation.ControlType]::TabItem,
    [Windows.Automation.ControlType]::ComboBox,[Windows.Automation.ControlType]::Edit,
    [Windows.Automation.ControlType]::Group,[Windows.Automation.ControlType]::DataItem,
    [Windows.Automation.ControlType]::Hyperlink,[Windows.Automation.ControlType]::DataGrid,
    [Windows.Automation.ControlType]::Table)
foreach ($type in $types) {
    foreach ($e in (Typed $context.doc $type)) {
        $c = $e.Current
        if ($c.IsOffscreen -or $c.Name.Length -gt 260 -or $c.Name -match '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}') { continue }
        $parentRid = $null
        $parent = [Windows.Automation.TreeWalker]::ControlViewWalker.GetParent($e)
        if ($null -ne $parent) { $parentRid = ($parent.GetRuntimeId() -join ',') }
        $publicHref = $null
        if ($c.ControlType -eq [Windows.Automation.ControlType]::Hyperlink) {
            try { $v = $e.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value } catch { $v = '' }
            if ($v -cmatch '^https://www\.tiktok\.com/music/[A-Za-z0-9_%.-]+-[0-9]+$') { $publicHref = $v }
            if ($v -cmatch '^https://ads\.tiktok\.com/business/creativecenter/music/[A-Za-z0-9_/%.-]+$') { $publicHref = $v }
        }
        $rows += [pscustomobject]@{type=$c.ControlType.ProgrammaticName;rid=($e.GetRuntimeId() -join ',');parentRid=$parentRid;name=$c.Name;enabled=$c.IsEnabled;rect=$c.BoundingRectangle.ToString();patterns=@($e.GetSupportedPatterns() | ForEach-Object {$_.ProgrammaticName});publicHref=$publicHref}
        if ($rows.Count -gt 600) { throw 'Bounded output count exceeded' }
    }
}
$fresh = Fresh-Context $true
Guard
[pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');action=$Action;hwnd=$targetHwnd;tabRid=$tabRid;documentRid=$fresh.rid;officialUrl=$fresh.url;ownAccountVerified=$fresh.own;account=$(if($fresh.own){'prop_pui'}else{$null});publicCatalogReadOnly=$true;rows=$rows;mutations=0;nativeMusicRightsVerified=$false;posted=$false} | ConvertTo-Json -Depth 6 -Compress
