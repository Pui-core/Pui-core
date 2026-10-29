param(
  [ValidateSet('inspect','deliver')][string]$Action = 'inspect',
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedSha256,
  [Parameter(Mandatory=$true)][ValidatePattern('^[0-9]{4}$')][string]$ProductionTime,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-zA-Z0-9._-]+[.]mp4$')][string]$SourceFileName,
  [ValidateSet('BGM版.mp4','声のみ版.mp4')][string]$TargetName = 'BGM版.mp4'
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$utf8 = New-Object Text.UTF8Encoding($false)
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$assemblyName = New-Object Reflection.AssemblyName('PP146ReadOnlyWindows')
$assembly = [AppDomain]::CurrentDomain.DefineDynamicAssembly($assemblyName, [Reflection.Emit.AssemblyBuilderAccess]::Run)
$module = $assembly.DefineDynamicModule('ReadOnlyWindowObservation')
$typeFlags = [Reflection.TypeAttributes]::Public -bor [Reflection.TypeAttributes]::Sealed -bor [Reflection.TypeAttributes]::Abstract
$typeBuilder = $module.DefineType('PP146ReadOnlyWindows', $typeFlags)
$methodFlags = [Reflection.MethodAttributes]::Public -bor [Reflection.MethodAttributes]::Static -bor [Reflection.MethodAttributes]::PinvokeImpl
foreach ($entry in @(@('GetForegroundWindow','user32.dll'), @('GetConsoleWindow','kernel32.dll'))) {
  $method = $typeBuilder.DefinePInvokeMethod($entry[0], $entry[1], $methodFlags, [Reflection.CallingConventions]::Standard, [IntPtr], [Type[]]@(), [Runtime.InteropServices.CallingConvention]::Winapi, [Runtime.InteropServices.CharSet]::Auto)
  $method.SetImplementationFlags($method.GetMethodImplementationFlags() -bor [Reflection.MethodImplAttributes]::PreserveSig)
}
$readOnlyNativeType = $typeBuilder.CreateType()
function ReadForegroundWindow { return $readOnlyNativeType.GetMethod('GetForegroundWindow').Invoke($null,@()).ToInt64() }
function ReadConsoleWindow { return $readOnlyNativeType.GetMethod('GetConsoleWindow').Invoke($null,@()).ToInt64() }
$foregroundBefore = ReadForegroundWindow
$consoleWindow = ReadConsoleWindow
if ($consoleWindow -ne 0) { throw 'No-console launch precondition failed; no file mutation performed' }
$sourceRoot = 'F:\Videos\ProjectP-EMBERWAKE-DevStory-2026-10-29\devstory-v01\videos'
$source = [IO.Path]::Combine($sourceRoot, $SourceFileName)
$nasRoot = '\\100.105.2.75\private\work\videos'
$directory = [IO.Path]::Combine($nasRoot, '2026-10-29', 'エンバーウェイク', ($ProductionTime + '_制作秘話_テンポ改稿_v01'))
$target = [IO.Path]::Combine($directory, $TargetName)
$decoder = 'C:\Users\pui\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe'
function Sha256File([string]$Path) {
  $algorithm = [Security.Cryptography.SHA256]::Create()
  $stream = [IO.File]::OpenRead($Path)
  try { return [BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
  finally { $stream.Dispose(); $algorithm.Dispose() }
}
if (!(Test-Path -LiteralPath $source -PathType Leaf)) { throw 'Source absent' }
$sourceSha = Sha256File $source
if ($sourceSha -cne $ExpectedSha256) { throw 'Source hash mismatch; no NAS write' }
if (!(Test-Path -LiteralPath $decoder -PathType Leaf)) { throw 'Pinned decoder absent' }
$record = [ordered]@{
  at = [DateTime]::UtcNow.ToString('o'); action = $Action; source = $source; sourceSha256 = $sourceSha
  nasPath = $target; consoleWindow = $consoleWindow; foregroundBefore = $foregroundBefore
  copied = $false; posted = $false
  deliveryScope = 'File copy/hash/direct NAS decode only; native project QA is recorded separately'
  mouseInput = 0; globalKeyInput = 0; foregroundOrFocusWrites = 0
}
if ($Action -eq 'deliver') {
  if (!(Test-Path -LiteralPath $nasRoot -PathType Container)) { throw 'Authorized NAS directory not accessible' }
  [void][IO.Directory]::CreateDirectory($directory)
  if ([IO.File]::Exists($target)) {
    if ((Sha256File $target) -cne $ExpectedSha256) { throw 'Existing NAS file preserved: hash differs' }
  } else {
    [IO.File]::Copy($source,$target,$false)
    $record.copied = $true
  }
  $nasSha = Sha256File $target
  if ($nasSha -cne $ExpectedSha256) { throw 'NAS hash mismatch; file preserved for investigation' }
  $info = New-Object Diagnostics.ProcessStartInfo
  $info.FileName = $decoder
  $info.Arguments = '-hide_banner -nostdin -threads 2 -v error -i "' + $target + '" -map 0:v:0 -map 0:a:0 -f null NUL'
  $info.UseShellExecute = $false
  $info.CreateNoWindow = $true
  $info.RedirectStandardOutput = $true
  $info.RedirectStandardError = $true
  $process = New-Object Diagnostics.Process
  $process.StartInfo = $info
  try {
    if (!$process.Start()) { throw 'Pinned decoder failed to start' }
    try { $process.PriorityClass = [Diagnostics.ProcessPriorityClass]::BelowNormal } catch { }
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    if (!$process.WaitForExit(90000)) {
      $process.Kill()
      [void]$process.WaitForExit(10000)
      throw 'Owned NAS decoder exceeded bounded runtime'
    }
    $decodeExit = $process.ExitCode
    $decodeError = $stderrTask.Result
    $decodeOutput = $stdoutTask.Result
    if ($decodeExit -ne 0 -or $decodeError.Length -ne 0) { throw ('NAS decode failed: exit=' + $decodeExit + ' ' + $decodeError) }
    $record.nasSha256 = $nasSha
    $record.nasDirectDecodeExitCode = $decodeExit
    $record.nasDirectDecodeErrors = $decodeError
    $record.nasBytes = ([IO.FileInfo]$target).Length
    $record.nasDirectoryFiles = @([IO.Directory]::EnumerateFiles($directory) | ForEach-Object { [IO.Path]::GetFileName($_) })
  } finally { $process.Dispose() }
}
$record.foregroundAfter = ReadForegroundWindow
$record.foregroundUnchanged = ($record.foregroundBefore -eq $record.foregroundAfter)
$record.consoleWindowAfter = ReadConsoleWindow
$record.finishedAt = [DateTime]::UtcNow.ToString('o')
$record | ConvertTo-Json -Depth 5 -Compress
