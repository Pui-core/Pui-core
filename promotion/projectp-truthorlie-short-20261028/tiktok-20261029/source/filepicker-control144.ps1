param(
    [Parameter(Mandatory=$true)][ValidateSet('read','set','open')][string]$Action,
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
public static class Pp144PickerRead {
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
    if (-not [Pp144PickerRead]::IsWindow([IntPtr]$h)) { throw 'Pinned window absent' }
    [uint32]$pidValue=0
    [void][Pp144PickerRead]::GetWindowThreadProcessId([IntPtr]$h,[ref]$pidValue)
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
    return [pscustomobject]@{hwnd=$h;rid=($a.GetRuntimeId() -join ',');class=[Pp144PickerRead]::ClassOf([IntPtr]$h);id=[Pp144PickerRead]::GetDlgCtrlID([IntPtr]$h);uiaType=$a.Current.ControlType.ProgrammaticName;enabled=[Pp144PickerRead]::IsWindowEnabled([IntPtr]$h);valuePattern=$hasValue;isReadOnly=$(if($hasValue){$vp.Current.IsReadOnly}else{$null});invokePattern=$hasInvoke;patterns=@($a.GetSupportedPatterns() | ForEach-Object {$_.ProgrammaticName})}
}
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class Pp144PickerInput {
    [DllImport("user32.dll",EntryPoint="SendMessageTimeoutW",ExactSpelling=true,CharSet=CharSet.Unicode,SetLastError=true)]
    private static extern IntPtr ReadMessage(IntPtr h,uint m,UIntPtr w,StringBuilder s,uint flags,uint timeout,out UIntPtr result);
    [DllImport("user32.dll",EntryPoint="SendMessageTimeoutW",ExactSpelling=true,CharSet=CharSet.Unicode,SetLastError=true)]
    private static extern IntPtr TextMessage(IntPtr h,uint m,UIntPtr w,string s,uint flags,uint timeout,out UIntPtr result);
    [DllImport("user32.dll",EntryPoint="SendMessageTimeoutW",ExactSpelling=true,SetLastError=true)]
    private static extern IntPtr ButtonMessage(IntPtr h,uint m,UIntPtr w,IntPtr l,uint flags,uint timeout,out UIntPtr result);
    [DllImport("user32.dll",EntryPoint="GetWindowLongPtrW",ExactSpelling=true)] public static extern IntPtr Style(IntPtr h,int index);
    [DllImport("user32.dll")] public static extern bool IsChild(IntPtr parent,IntPtr child);
    public static string ReadFilename(IntPtr h) {
        var b=new StringBuilder(1024); UIntPtr result;
        if(ReadMessage(h,13,(UIntPtr)1024,b,2,2000,out result)==IntPtr.Zero) throw new InvalidOperationException("Filename read failed or timed out");
        return b.ToString();
    }
    public static void SetFilename(IntPtr h,string value) {
        UIntPtr result;
        if(TextMessage(h,12,UIntPtr.Zero,value,2,2000,out result)==IntPtr.Zero || result.ToUInt64()!=1) throw new InvalidOperationException("Filename set failed or timed out");
    }
    public static void RequestOpen(IntPtr h) {
        UIntPtr result;
        if(ButtonMessage(h,245,UIntPtr.Zero,IntPtr.Zero,2,2000,out result)==IntPtr.Zero) throw new InvalidOperationException("Open message failed or timed out; inspect without retry");
    }
}
'@
$dialogHwnd=62789604L
$dialogPid=48244
$dialogBirth='2026-10-28T21:46:58.1226712Z'
$editHwnd=84350650L
$comboHwnd=193464658L
$comboExHwnd=143920782L
$openHwnd=53875816L
$probePath='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp-publish-20261028\filepicker-probe144.json'
$probeSha='e85bc21dcf3a79837648eb4d4aedf0f92027b95a0afd7a3da0604c0129de9619'
function Standard-Control([long]$h,[string]$class,[int]$id) {
    if ((Window-Owner $h) -ne $dialogPid -or [Pp144PickerRead]::ClassOf([IntPtr]$h) -cne $class -or
        [Pp144PickerRead]::GetDlgCtrlID([IntPtr]$h) -ne $id -or -not [Pp144PickerRead]::IsWindowVisible([IntPtr]$h) -or
        -not [Pp144PickerRead]::IsWindowEnabled([IntPtr]$h) -or -not [Pp144PickerInput]::IsChild([IntPtr]$dialogHwnd,[IntPtr]$h)) {throw 'Exact standard picker control differs'}
}
function Fresh-Case {
    $null=Browser-Binding
    if ((Get-FileHash -LiteralPath $probePath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $probeSha) {throw 'Frozen actual control probe differs'}
    $probe=Get-Content -LiteralPath $probePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($probe.issue -ne 144 -or $probe.ownBeforeTicketSha256 -cne $ticketSha -or $probe.sourceVideoSha256 -cne $assetSha -or
        -not $probe.uniqueStandardControls -or $probe.dialogCount -ne 1 -or $probe.dialogs[0].hwnd -ne $dialogHwnd) {throw 'Probe scope differs'}
    $p=Get-Process -Id $dialogPid
    if ($p.SessionId -ne 1 -or $p.StartTime.ToUniversalTime().ToString('o') -cne $dialogBirth -or
        (Window-Owner $dialogHwnd) -ne $dialogPid -or [Pp144PickerRead]::ClassOf([IntPtr]$dialogHwnd) -cne '#32770' -or
        -not [Pp144PickerRead]::IsWindowVisible([IntPtr]$dialogHwnd) -or -not [Pp144PickerRead]::IsWindowEnabled([IntPtr]$dialogHwnd) -or
        (@([Pp144PickerRead]::OwnerChain([IntPtr]$dialogHwnd)) -join ',') -cne '62789604,51187480') {throw 'Owned standard dialog identity differs'}
    Standard-Control $editHwnd 'Edit' 1148
    Standard-Control $comboHwnd 'ComboBox' 1148
    Standard-Control $comboExHwnd 'ComboBoxEx32' 1148
    Standard-Control $openHwnd 'Button' 1
    if ([long][Pp144PickerRead]::GetParent([IntPtr]$editHwnd) -ne $comboHwnd -or
        [long][Pp144PickerRead]::GetParent([IntPtr]$comboHwnd) -ne $comboExHwnd -or
        [long][Pp144PickerRead]::GetDlgItem([IntPtr]$dialogHwnd,1) -ne $openHwnd -or
        (([Pp144PickerInput]::Style([IntPtr]$editHwnd,-16).ToInt64()) -band 0x800) -ne 0) {throw 'Filename host, Open ID or read-only style differs'}
    Guard
    return [Pp144PickerInput]::ReadFilename([IntPtr]$editHwnd)
}
function Filename-State([string]$value) {
    if ($value -ceq '') {return 'empty'}
    if ($value -ceq $asset) {return 'desired'}
    return 'other'
}
$current=Fresh-Case
$state=Filename-State $current
if ($Action -eq 'read') {
    [pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');action=$Action;dialogHwnd=$dialogHwnd;editHwnd=$editHwnd;openHwnd=$openHwnd;filenameState=$state;filenameLength=$current.Length;desiredMatch=($state -ceq 'desired');ownTicketSha256=$ticketSha;probeSha256=$probeSha;inputActions=0;fileAttachIntents=0;publicationIntents=0} | ConvertTo-Json -Compress
    exit
}
if ($state -ceq 'other') {throw 'Filename changed by another actor; no overwrite'}
if ($Action -eq 'set') {
    $calls=0
    if ($state -ceq 'empty') {
        if ((Fresh-Case) -cne '') {throw 'Filename CAS changed before set'}
        [Pp144PickerInput]::SetFilename([IntPtr]$editHwnd,$asset)
        $calls=1
    }
    $after=Fresh-Case
    if ($after -cne $asset) {throw 'Filename exact readback mismatch; no Open'}
    [pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');action=$Action;setTextCalls=$calls;exactReadback=$true;filenameState='desired';fileAttachIntents=0;publicationIntents=0;opened=$false} | ConvertTo-Json -Compress
    exit
}
if ($state -cne 'desired') {throw 'Exact desired filename must already be set before Open'}
$intent='\\wsl.localhost\Ubuntu\home\pui\tmp\projectp144-live\file-attach-intent.json'
$record=[pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');accountId='prop_pui';ownBeforeTicketSha256=$ticketSha;probeSha256=$probeSha;sourceVideoSha256=$assetSha;browserHwnd=$rootHwnd;dialogHwnd=$dialogHwnd;dialogPid=$dialogPid;dialogBirth=$dialogBirth;editHwnd=$editHwnd;openHwnd=$openHwnd;maxFileAttachIntents=1;publicationIntents=0;status='pending_native_upload_readback_do_not_repeat'}
Guard
$bytes=[Text.UTF8Encoding]::new($false).GetBytes(($record | ConvertTo-Json))
$stream=[IO.File]::Open($intent,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
try {$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)} finally {$stream.Dispose()}
if ((Fresh-Case) -cne $asset) {throw 'Filename changed after one-shot intent; inspect without retry'}
Guard
[Pp144PickerInput]::RequestOpen([IntPtr]$openHwnd)
[pscustomobject]@{issue=144;at=[DateTimeOffset]::UtcNow.ToString('o');action=$Action;bmClickMessages=1;fileAttachIntents=1;attachmentConfirmed=$false;publicationIntents=0;posted=$false;retry=$false;status='Open requested once; inspect native upload result'} | ConvertTo-Json -Compress
