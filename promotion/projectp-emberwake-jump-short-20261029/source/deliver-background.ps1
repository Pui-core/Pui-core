param([ValidateSet('inspect','deliver')][string]$Action='inspect',[Parameter(Mandatory=$true)][ValidatePattern('^[0-9]{4}$')][string]$ProductionTime)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$utf8=New-Object Text.UTF8Encoding($false)
[Console]::OutputEncoding=$utf8
$OutputEncoding=$utf8
$assemblyName=New-Object Reflection.AssemblyName('PP152ReadOnlyWindows')
$assembly=[AppDomain]::CurrentDomain.DefineDynamicAssembly($assemblyName,[Reflection.Emit.AssemblyBuilderAccess]::Run)
$module=$assembly.DefineDynamicModule('ReadOnlyWindowObservation')
$typeFlags=[Reflection.TypeAttributes]::Public -bor [Reflection.TypeAttributes]::Sealed -bor [Reflection.TypeAttributes]::Abstract
$typeBuilder=$module.DefineType('PP152ReadOnlyWindows',$typeFlags)
$methodFlags=[Reflection.MethodAttributes]::Public -bor [Reflection.MethodAttributes]::Static -bor [Reflection.MethodAttributes]::PinvokeImpl
foreach($entry in @(@('GetForegroundWindow','user32.dll'),@('GetConsoleWindow','kernel32.dll'))){
 $method=$typeBuilder.DefinePInvokeMethod($entry[0],$entry[1],$methodFlags,[Reflection.CallingConventions]::Standard,[IntPtr],[Type[]]@(),[Runtime.InteropServices.CallingConvention]::Winapi,[Runtime.InteropServices.CharSet]::Auto)
 $method.SetImplementationFlags($method.GetMethodImplementationFlags() -bor [Reflection.MethodImplAttributes]::PreserveSig)
}
$readOnlyNativeType=$typeBuilder.CreateType()
function ReadForegroundWindow{return $readOnlyNativeType.GetMethod('GetForegroundWindow').Invoke($null,@()).ToInt64()}
function ReadConsoleWindow{return $readOnlyNativeType.GetMethod('GetConsoleWindow').Invoke($null,@()).ToInt64()}
function Sha256File([string]$Path){
 $algorithm=[Security.Cryptography.SHA256]::Create();$stream=[IO.File]::OpenRead($Path)
 try{return [BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-','').ToLowerInvariant()}
 finally{$stream.Dispose();$algorithm.Dispose()}
}
$foregroundBefore=ReadForegroundWindow
$consoleWindow=ReadConsoleWindow
if($consoleWindow -ne 0){throw 'No-console precondition failed; no file mutation performed'}
$sourceRoot='F:\Videos\ProjectP-EMBERWAKE-Jump-2026-10-29\jump-v01\videos'
if(([IO.FileInfo]([IO.Path]::Combine($sourceRoot,'emberwake-jump-v03-bgm.mp4'))).LastWriteTime.ToString('HHmm') -cne $ProductionTime){throw 'Directory HHmm must match actual final BGM export modification time'}
$nasRoot='\\100.105.2.75\private\work\videos'
$directory=[IO.Path]::Combine($nasRoot,'2026-10-29','エンバーウェイク',($ProductionTime+'_押下で変わる跳躍_見出し音改_v03'))
$decoder='C:\ffmpeg\bin\ffmpeg.exe'
$expectedDecoder='83b7d64913f17eb1042dde8ce4384f7a820585e850ab4f99853a47a800275329'
if(!(Test-Path -LiteralPath $decoder -PathType Leaf) -or (Sha256File $decoder) -cne $expectedDecoder){throw 'Pinned decoder absent or mismatched'}
$entries=@(
 @{variant='bgm';name='emberwake-jump-v03-bgm.mp4';target='BGM版.mp4';sha='9e1a38827ec67bdc59876bc4abc7627e8927c95960bc1a529d7332dcc607bbf2'},
 @{variant='voice';name='emberwake-jump-v03-voice.mp4';target='声・効果音版.mp4';sha='c669117064ac5c37f151ddf47d3869156c058634c525e01e3db65fcd36c2df11'}
)
foreach($entry in $entries){$source=[IO.Path]::Combine($sourceRoot,$entry.name);if(!(Test-Path -LiteralPath $source -PathType Leaf) -or (Sha256File $source) -cne $entry.sha){throw 'Source absent or mismatched; no NAS write'}}
$record=[ordered]@{issue=152;at=[DateTime]::UtcNow.ToString('o');action=$Action;nasDirectory=$directory;consoleWindow=$consoleWindow;foregroundBefore=$foregroundBefore;decoder=$decoder;decoderSha256=$expectedDecoder;entries=@();mouseInput=0;globalKeyInput=0;foregroundOrFocusWrites=0;posted=$false}
if($Action -eq 'deliver'){
 if(!(Test-Path -LiteralPath $nasRoot -PathType Container)){throw 'Authorized NAS inaccessible'}
 [void][IO.Directory]::CreateDirectory($directory)
 foreach($entry in $entries){
  $source=[IO.Path]::Combine($sourceRoot,$entry.name);$target=[IO.Path]::Combine($directory,$entry.target);$copied=$false
  if([IO.File]::Exists($target)){if((Sha256File $target) -cne $entry.sha){throw 'Existing different NAS file preserved'}}else{[IO.File]::Copy($source,$target,$false);$copied=$true}
  $nasSha=Sha256File $target;if($nasSha -cne $entry.sha){throw 'NAS hash mismatch; file preserved'}
  $info=New-Object Diagnostics.ProcessStartInfo;$info.FileName=$decoder
  $info.Arguments='-hide_banner -nostdin -threads 2 -v error -i "'+$target+'" -map 0:v:0 -map 0:a:0 -f null NUL'
  $info.UseShellExecute=$false;$info.CreateNoWindow=$true;$info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
  $process=New-Object Diagnostics.Process;$process.StartInfo=$info
  try{
   if(!$process.Start()){throw 'Decoder did not start'}
   try{$process.PriorityClass=[Diagnostics.ProcessPriorityClass]::BelowNormal}catch{}
   $stdoutTask=$process.StandardOutput.ReadToEndAsync();$stderrTask=$process.StandardError.ReadToEndAsync()
   if(!$process.WaitForExit(90000)){$process.Kill();[void]$process.WaitForExit(10000);throw 'Owned decoder exceeded bounded runtime'}
   $decodeExit=$process.ExitCode;$decodeError=$stderrTask.Result;$decodeOutput=$stdoutTask.Result
   if($decodeExit -ne 0 -or $decodeError.Length -ne 0){throw ('NAS direct decode failed '+$decodeExit+' '+$decodeError)}
   $record.entries+=@{variant=$entry.variant;source=$source;sourceSha256=$entry.sha;nasPath=$target;nasSha256=$nasSha;bytes=([IO.FileInfo]$target).Length;copied=$copied;nasDirectDecodeExitCode=$decodeExit;nasDirectDecodeErrors=$decodeError}
  }finally{$process.Dispose()}
 }
 $record.nasDirectoryFiles=@([IO.Directory]::EnumerateFiles($directory)|ForEach-Object{[IO.Path]::GetFileName($_)})
}
$record.foregroundAfter=ReadForegroundWindow;$record.foregroundUnchanged=($record.foregroundBefore -eq $record.foregroundAfter)
$record.consoleWindowAfter=ReadConsoleWindow;$record.finishedAt=[DateTime]::UtcNow.ToString('o')
$record|ConvertTo-Json -Depth 6 -Compress
