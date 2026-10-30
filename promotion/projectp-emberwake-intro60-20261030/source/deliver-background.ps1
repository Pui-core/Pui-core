param([ValidateSet('inspect','deliver')][string]$Action='inspect')
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$utf8=New-Object Text.UTF8Encoding($false)
[Console]::OutputEncoding=$utf8
$OutputEncoding=$utf8
$assemblyName=New-Object Reflection.AssemblyName('PP156ReadOnlyWindows')
$assembly=[AppDomain]::CurrentDomain.DefineDynamicAssembly($assemblyName,[Reflection.Emit.AssemblyBuilderAccess]::Run)
$module=$assembly.DefineDynamicModule('ReadOnlyWindowObservation')
$typeFlags=[Reflection.TypeAttributes]::Public -bor [Reflection.TypeAttributes]::Sealed -bor [Reflection.TypeAttributes]::Abstract
$typeBuilder=$module.DefineType('PP156ReadOnlyWindows',$typeFlags)
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
$root='F:\Videos\ProjectP-EMBERWAKE-Intro60-2026-10-30\intro65-v01'
$binding=Get-Content -LiteralPath ([IO.Path]::Combine($root,'qa','output-binding-v05.json')) -Raw -Encoding UTF8|ConvertFrom-Json
if($binding.issue -ne 156 -or $binding.seconds -ne 65 -or $binding.bindings.Count -ne 2){throw 'Wrong output binding'}
$bgm=[IO.FileInfo]([IO.Path]::Combine($root,'videos','emberwake-intro65-v05-bgm.mp4'))
$productionTime=$bgm.LastWriteTime.ToString('HHmm')
$productionDate=$bgm.LastWriteTime.ToString('yyyy-MM-dd')
$nasRoot='\\100.105.2.75\private\work\videos'
$directory=[IO.Path]::Combine($nasRoot,$productionDate,'エンバーウェイク',($productionTime+'_灯で変わる道_構成刷新_v05'))
$decoder='C:\ffmpeg\bin\ffmpeg.exe'
$expectedDecoder='83b7d64913f17eb1042dde8ce4384f7a820585e850ab4f99853a47a800275329'
if(!(Test-Path -LiteralPath $decoder -PathType Leaf) -or (Sha256File $decoder) -cne $expectedDecoder){throw 'Pinned decoder absent or mismatched'}
$entries=@()
foreach($row in $binding.bindings){$name='emberwake-intro65-v05-'+$row.variant+'.mp4';$target=if($row.variant -ceq 'bgm'){'BGM版.mp4'}else{'声・効果音版.mp4'};$entries+=@{variant=$row.variant;name=$name;target=$target;sha=$row.sha256}}
foreach($entry in $entries){$source=[IO.Path]::Combine($root,'videos',$entry.name);if(!(Test-Path -LiteralPath $source -PathType Leaf) -or (Sha256File $source) -cne $entry.sha){throw 'Source absent/mismatched; no NAS write'}}
$record=[ordered]@{issue=156;at=[DateTime]::UtcNow.ToString('o');action=$Action;productionTime=$productionTime;productionDate=$productionDate;nasDirectory=$directory;consoleWindow=$consoleWindow;foregroundBefore=$foregroundBefore;decoder=$decoder;decoderSha256=$expectedDecoder;entries=@();mouseInput=0;globalKeyInput=0;foregroundOrFocusWrites=0;clipboardAccess=0;posted=$false}
if($Action -eq 'deliver'){
 if(!(Test-Path -LiteralPath $nasRoot -PathType Container)){throw 'Authorized NAS inaccessible'}
 [void][IO.Directory]::CreateDirectory($directory)
 foreach($entry in $entries){
  $source=[IO.Path]::Combine($root,'videos',$entry.name);$target=[IO.Path]::Combine($directory,$entry.target);$copied=$false
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
   if(!$process.WaitForExit(180000)){$process.Kill();[void]$process.WaitForExit(10000);throw 'Owned decoder exceeded bounded runtime'}
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
