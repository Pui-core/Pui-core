param(
    [Parameter(Mandatory=$true)][ValidateSet('read','openNativeMusic')][string]$Action,
    [Parameter(Mandatory=$true)][string]$BoundRunId,
    [Parameter(Mandatory=$true)][string]$BoundExpiry,
    [Parameter(Mandatory=$true)][string]$BoundOwner
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$clock = [Diagnostics.Stopwatch]::StartNew()
$browserPid = 34828
$browserBirth = '2026-10-27T17:54:34.0063169Z'
$rootHwnd = 51187480L
$tabRid = '42,51187480,4,-17035'
$docRid = '42,51187480,4,-18262'
$asset = 'F:\Videos\ProjectP-TruthOrLie-Short-2026-10-28\model-motion-20261029\videos\truthorlie-real-v10-voice.mp4'
$assetSha = 'e683ad00bad973a09456fd49895f8eddcde884be9c37f2ae5dca8bbaa4935592'
$ticketPath = '\\wsl.localhost\Ubuntu\home\pui\tmp\projectp144-live\own-before-filepicker.json'
$ticketSha = 'adf8fa5a82965f4cae2b76b51b109c093f629f892583c6a87bed35182b01dc5f'
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
    if ($p.ProcessName -cne 'firefox' -or $p.SessionId -ne 1 -or $p.StartTime.ToUniversalTime().ToString('o') -cne $browserBirth -or
        [Diagnostics.Process]::GetCurrentProcess().SessionId -ne 1) { throw 'Pinned Firefox identity differs' }
    if ((Get-FileHash -LiteralPath $ticketPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $ticketSha) { throw 'Frozen own-before-picker ticket differs' }
    $t = Get-Content -LiteralPath $ticketPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($t.issue -ne 144 -or $t.hwnd -ne $rootHwnd -or $t.tabRid -cne $tabRid -or $t.documentRid -cne $docRid -or
        $t.pid -ne $browserPid -or $t.session -ne 1 -or $t.birth -cne $browserBirth -or $t.accountId -cne 'prop_pui' -or
        -not $t.ownAccountVerified -or $t.profileHref -cne 'https://www.tiktok.com/@prop_pui' -or
        $t.officialPath -cne '/tiktokstudio/upload' -or $t.sourceVideoSha256 -cne $assetSha -or
        $t.fileSelectRuntimeId -cne '42,51187480,4,-18574' -or $t.fileAttachIntents -ne 0 -or $t.publicationIntents -ne 0 -or
        (@($t.allowedQueryKeys | Sort-Object) -join ',') -cne 'from,tab') { throw 'Frozen own ticket scope differs' }
    if ((Get-FileHash -LiteralPath $asset -Algorithm SHA256).Hash.ToLowerInvariant() -cne $assetSha) { throw 'Frozen v10 file differs' }
}
Guard
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class Pp144MusicOpenBinding {
    private delegate bool Callback(IntPtr h, IntPtr l);
    [DllImport("user32.dll")] private static extern bool EnumWindows(Callback f, IntPtr l);
    [DllImport("user32.dll")] private static extern bool EnumChildWindows(IntPtr h, Callback f, IntPtr l);
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] public static extern bool IsWindowEnabled(IntPtr h);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
    [DllImport("user32.dll")] public static extern IntPtr GetWindow(IntPtr h, uint command);
    [DllImport("user32.dll")] public static extern IntPtr GetParent(IntPtr h);
    [DllImport("user32.dll")] public static extern int GetDlgCtrlID(IntPtr h);
    [DllImport("user32.dll")] public static extern IntPtr GetDlgItem(IntPtr h, int id);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] private static extern int GetClassName(IntPtr h, StringBuilder b, int n);
    public static string ClassOf(IntPtr h) { var b=new StringBuilder(80); GetClassName(h,b,b.Capacity); return b.ToString(); }
    public static long[] OwnerChain(IntPtr h) {
        var chain=new List<long>();
        for(int i=0;i<12 && h!=IntPtr.Zero;i++) {
            long n=h.ToInt64(); if(chain.Contains(n)) break; chain.Add(n);
            if(n==51187480 || n==69024) break;
            h=GetWindow(h,4);
        }
        return chain.ToArray();
    }
    public static long[] Dialogs() {
        var found=new List<long>(); int count=0;
        EnumWindows(delegate(IntPtr h,IntPtr l) {
            if(++count>1024) throw new InvalidOperationException("Top-window read limit");
            if(!IsWindowVisible(h) || ClassOf(h)!="#32770") return true;
            var chain=OwnerChain(h);
            if(Array.IndexOf(chain,51187480L)>=0 && Array.IndexOf(chain,69024L)<0) found.Add(h.ToInt64());
            return found.Count<=3;
        },IntPtr.Zero);
        if(found.Count>3) throw new InvalidOperationException("Dialog count limit");
        return found.ToArray();
    }
    public static long[] FilenameEdits(IntPtr dialog) {
        var found=new List<long>(); int count=0;
        EnumChildWindows(dialog,delegate(IntPtr h,IntPtr l) {
            if(++count>256) throw new InvalidOperationException("Child metadata read limit");
            if(GetDlgCtrlID(h)==1148 && IsWindowVisible(h) && ClassOf(h)=="Edit") found.Add(h.ToInt64());
            return found.Count<=3;
        },IntPtr.Zero);
        if(found.Count>3) throw new InvalidOperationException("Filename field count limit");
        return found.ToArray();
    }
}
'@
function Window-Owner([long]$h) {
    if (-not [Pp144MusicOpenBinding]::IsWindow([IntPtr]$h)) { throw 'Pinned window absent' }
    [uint32]$pidValue=0
    [void][Pp144MusicOpenBinding]::GetWindowThreadProcessId([IntPtr]$h,[ref]$pidValue)
    return $pidValue
}
function Browser-Binding {
    Guard
    if ((Window-Owner $rootHwnd) -ne $browserPid -or (Window-Owner 69024L) -ne $browserPid) { throw 'Pinned or protected window owner differs' }
    $r = [Windows.Automation.AutomationElement]::FromHandle([IntPtr]$rootHwnd)
    $tabs = $r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::TabItem))
    if ($tabs.Count -gt 80) { throw 'Tab read bound exceeded' }
    $tab = @($tabs | Where-Object {($_.GetRuntimeId() -join ',') -ceq $tabRid -and $_.Current.Name -cmatch '^TikTok Studio(?:$|\s)' -and $_.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Current.IsSelected})
    if ($tab.Count -ne 1) { throw 'Exact native TikTok tab not selected' }
    $docs = $r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Document))
    if ($docs.Count -gt 20) { throw 'Document read bound exceeded' }
    $doc = @($docs | Where-Object {($_.GetRuntimeId() -join ',') -ceq $docRid -and $_.Current.Name -ceq 'TikTok Studio'})
    if ($doc.Count -ne 1) { throw 'Frozen native document differs' }
    $urlHits=@();$top=$r.Current.BoundingRectangle.Top
    foreach ($type in @([Windows.Automation.ControlType]::ComboBox,[Windows.Automation.ControlType]::Edit)) {
        $els=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,$type))
        if ($els.Count -gt 100) { throw 'Address metadata count bound exceeded' }
        foreach ($e in $els) {
            $b=$e.Current.BoundingRectangle
            if ($b.IsEmpty -or $b.Top -lt $top -or $b.Bottom -gt ($top+140)) { continue }
            try {$v=$e.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value} catch {continue}
            if ($v.StartsWith('www.tiktok.com/')) {$v='https://'+$v}
            $uri=$null
            if (-not [Uri]::TryCreate($v,[UriKind]::Absolute,[ref]$uri)) {continue}
            if ($uri.Scheme -cne 'https' -or $uri.Host -cne 'www.tiktok.com' -or $uri.AbsolutePath -cne '/tiktokstudio/upload' -or -not $uri.IsDefaultPort -or $uri.UserInfo -cne '' -or $uri.Fragment -cne '') {continue}
            $keys=@($uri.Query.TrimStart('?').Split('&') | Where-Object {$_} | ForEach-Object {$_.Split('=')[0]})
            if ($keys.Count -gt 2 -or @($keys | Where-Object {$_ -cnotin @('from','tab')}).Count -gt 0 -or @($keys | Select-Object -Unique).Count -ne $keys.Count) {continue}
            $urlHits+='official-upload'
        }
    }
    if ($urlHits.Count -lt 1) {throw 'Current native official upload path/query scope absent'}
    return $r
}
function Control-Metadata([long]$h) {
    $a=[Windows.Automation.AutomationElement]::FromHandle([IntPtr]$h)
    $vp=$null;$hasValue=$a.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern,[ref]$vp)
    $ip=$null;$hasInvoke=$a.TryGetCurrentPattern([Windows.Automation.InvokePattern]::Pattern,[ref]$ip)
    return [pscustomobject]@{hwnd=$h;rid=($a.GetRuntimeId() -join ',');class=[Pp144MusicOpenBinding]::ClassOf([IntPtr]$h);id=[Pp144MusicOpenBinding]::GetDlgCtrlID([IntPtr]$h);uiaType=$a.Current.ControlType.ProgrammaticName;enabled=[Pp144MusicOpenBinding]::IsWindowEnabled([IntPtr]$h);valuePattern=$hasValue;isReadOnly=$(if($hasValue){$vp.Current.IsReadOnly}else{$null});invokePattern=$hasInvoke;patterns=@($a.GetSupportedPatterns() | ForEach-Object {$_.ProgrammaticName})}
}
$uploadedTicketPath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp144-live\uploaded-asset-ticket.json'
$uploadedTicketSha='aa27affd8fbd624eeb099dd7ef8bb465cbbbff2caf3e43b41a0707028f814004'
$script:profileExpansions=0
function Fresh-Uploaded {
    $r=Browser-Binding
    if ((Get-FileHash -LiteralPath $uploadedTicketPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $uploadedTicketSha) {throw 'Frozen uploaded ticket differs'}
    $t=Get-Content -LiteralPath $uploadedTicketPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($t.issue -ne 144 -or $t.productionIssue -ne 143 -or $t.revision -cne 'v10' -or $t.accountId -cne 'prop_pui' -or
        $t.windowHandle -ne $rootHwnd -or $t.selectedTabRid -cne $tabRid -or $t.documentRid -cne $docRid -or
        $t.sourceVideoSha256 -cne $assetSha -or $t.ownBeforeFilePickerTicketSha256 -cne $ticketSha -or
        $t.fileAttachIntents -ne 1 -or $t.publicationIntents -ne 0 -or $t.nativeMusicSelected -or
        $t.nativeFilename -cne 'truthorlie-real-v10-voice.mp4' -or $t.nativeFilenameRid -cne '42,51187480,4,-11340' -or
        $t.nativeCompleteRid -cne '42,51187480,4,-18440') {throw 'Frozen uploaded asset scope differs'}
    $all=$r.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Document))
    $doc=@($all | Where-Object {($_.GetRuntimeId() -join ',') -ceq $docRid -and $_.Current.Name -ceq 'TikTok Studio'})
    if ($doc.Count -ne 1) {throw 'Exact uploaded document absent'}
    $texts=$doc[0].FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Text))
    if ($texts.Count -gt 500) {throw 'Uploaded text count bound exceeded'}
    $file=@($texts | Where-Object {($_.GetRuntimeId() -join ',') -ceq $t.nativeFilenameRid -and $_.Current.Name -ceq $t.nativeFilename})
    $complete=@($texts | Where-Object {($_.GetRuntimeId() -join ',') -ceq $t.nativeCompleteRid -and $_.Current.Name -ceq $t.nativeComplete})
    if ($file.Count -ne 1 -or $complete.Count -ne 1) {throw 'Actual uploaded filename/completion differs'}
    Guard
    return [pscustomobject]@{root=$r;doc=$doc[0];ticket=$t}
}
function Visible-Own($c) {
    $links=$c.doc.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Hyperlink))
    if ($links.Count -gt 100) {throw 'Own link read bound exceeded'}
    $own=@()
    foreach ($e in $links) {
        if ($e.Current.IsOffscreen) {continue}
        try {$href=$e.GetCurrentPattern([Windows.Automation.ValuePattern]::Pattern).Current.Value} catch {continue}
        if ($href -ceq 'https://www.tiktok.com/@prop_pui') {$own+=$e}
    }
    return $own
}
function Ensure-Own($c) {
    $own=@(Visible-Own $c)
    if ($own.Count -ne 1) {
        if ($script:profileExpansions -ge 2) {throw 'Bounded own menu expansions reached'}
        $buttons=$c.doc.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Button))
        $avatar=@($buttons | Where-Object {($_.GetRuntimeId() -join ',') -ceq '42,51187480,4,-18818' -and $_.Current.Name -ceq '' -and $_.Current.IsEnabled -and -not $_.Current.IsOffscreen})
        if ($avatar.Count -ne 1) {throw 'Observed own avatar differs'}
        $ec=$avatar[0].GetCurrentPattern([Windows.Automation.ExpandCollapsePattern]::Pattern)
        if ($ec.Current.ExpandCollapseState -ne [Windows.Automation.ExpandCollapseState]::Collapsed) {throw 'Own menu not in known collapsed state'}
        Guard
        $ec.Expand();$script:profileExpansions++
        for ($i=0;$i -lt 12;$i++) {Start-Sleep -Milliseconds 100;Guard;$own=@(Visible-Own $c);if($own.Count -eq 1){break}}
    }
    if ($own.Count -ne 1) {throw 'Fresh exact visible own href absent'}
}
function Music-Button($c) {
    $buttons=$c.doc.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::Button))
    if ($buttons.Count -gt 200) {throw 'Button count bound exceeded'}
    $hit=@($buttons | Where-Object {($_.GetRuntimeId() -join ',') -ceq '42,51187480,4,-11499' -and $_.Current.Name -ceq '楽曲' -and $_.Current.IsEnabled})
    if ($hit.Count -ne 1) {throw 'Actual native music button differs'}
    return $hit[0]
}
$context=Fresh-Uploaded
$button=Music-Button $context
if ($Action -eq 'read') {
    [pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');action=$Action;uploadedTicketSha256=$uploadedTicketSha;uploadedAssetMatched=$true;musicButtonRid='42,51187480,4,-11499';offscreen=$button.Current.IsOffscreen;patterns=@($button.GetSupportedPatterns() | ForEach-Object {$_.ProgrammaticName});ownAccountVerifiedNow=(@(Visible-Own $context).Count -eq 1);mutations=0;publicationIntents=0} | ConvertTo-Json -Depth 4 -Compress
    exit
}
Ensure-Own $context
Guard
$button.GetCurrentPattern([Windows.Automation.ScrollItemPattern]::Pattern).ScrollIntoView()
$context=Fresh-Uploaded
Ensure-Own $context
$button=Music-Button $context
if ($button.Current.IsOffscreen -or $button.Current.BoundingRectangle.IsEmpty) {throw 'Native music target not visible after standard scroll'}
$null=$button.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern)
$intent='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp144-live\open-native-music-intent.json'
$record=[pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');action='openNativeMusic';accountId='prop_pui';uploadedTicketSha256=$uploadedTicketSha;sourceVideoSha256=$assetSha;windowHandle=$rootHwnd;tabRid=$tabRid;documentRid=$docRid;buttonRid='42,51187480,4,-11499';maxEditorOpenIntents=1;fileAttachIntents=0;publicationIntents=0;status='pending_native_editor_readback_no_retry'}
Guard
$bytes=[Text.UTF8Encoding]::new($false).GetBytes(($record | ConvertTo-Json))
$stream=[IO.File]::Open($intent,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
try {$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)} finally {$stream.Dispose()}
$context=Fresh-Uploaded
Ensure-Own $context
$button=Music-Button $context
if ($button.Current.IsOffscreen -or $button.Current.BoundingRectangle.IsEmpty) {throw 'Music button moved before Invoke'}
Guard
$button.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
[pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');action=$Action;scrollIntoViewCalls=1;profileExpansions=$script:profileExpansions;nativeMusicInvokeCalls=1;editorConfirmed=$false;nativeMusicSelected=$false;nativeMusicRightsVerified=$false;fileAttachIntents=0;publicationIntents=0;retry=$false} | ConvertTo-Json -Compress
