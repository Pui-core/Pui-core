param([Parameter(Mandatory=$true)][string]$BundleRoot)
$ErrorActionPreference='Stop'
$utf8=New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding=$utf8
$records=New-Object System.Collections.Generic.List[object]
$receipt=Join-Path $BundleRoot 'qa\delivery-windows-run.json'
function Quote-NativeArg([string]$Value){
 $b=New-Object System.Text.StringBuilder
 [void]$b.Append('"');$slashes=0
 foreach($ch in $Value.ToCharArray()){
  if($ch -eq [char]92){$slashes++;continue}
  if($ch -eq [char]34){[void]$b.Append(('\' * (2*$slashes+1)));[void]$b.Append('"');$slashes=0;continue}
  if($slashes){[void]$b.Append(('\' * $slashes));$slashes=0}
  [void]$b.Append($ch)
 }
 if($slashes){[void]$b.Append(('\' * (2*$slashes)))}
 [void]$b.Append('"');return $b.ToString()
}
function Save-Receipt([bool]$Ok,[string]$Message){
 $o=[ordered]@{ok=$Ok;bundle=$BundleRoot;steps=@($records.ToArray());message=$Message}
 [System.IO.File]::WriteAllText($receipt,(($o|ConvertTo-Json -Depth 30).Replace("`r`n","`n")),$utf8)
}
function Invoke-Native([string]$Exe,[string[]]$NativeArgs){
 $si=New-Object System.Diagnostics.ProcessStartInfo
 $si.FileName=$Exe
 $si.Arguments=(($NativeArgs|ForEach-Object {Quote-NativeArg $_}) -join ' ')
 $si.UseShellExecute=$false;$si.CreateNoWindow=$true
 $si.RedirectStandardOutput=$true;$si.RedirectStandardError=$true
 $si.StandardOutputEncoding=$utf8;$si.StandardErrorEncoding=$utf8
 $p=New-Object System.Diagnostics.Process;$p.StartInfo=$si
 $started=[DateTime]::UtcNow
 [void]$p.Start();$stdout=$p.StandardOutput.ReadToEndAsync();$stderr=$p.StandardError.ReadToEndAsync()
 if(-not $p.WaitForExit(180000)){throw 'Owned native verification step exceeded180s; inspect process before retry.'}
 $p.WaitForExit()
 $r=[ordered]@{exe=$Exe;args=$NativeArgs;exit=$p.ExitCode;seconds=([DateTime]::UtcNow-$started).TotalSeconds;stdout=$stdout.Result;stderr=$stderr.Result}
 $records.Add($r);Save-Receipt $false 'In progress'
 $exit=$p.ExitCode;$p.Dispose()
 if($exit -ne 0){throw ('Native exit '+$exit+' for '+$Exe)}
 Write-Output ('Completed native step '+$records.Count)
}
try {
 $ec='C:\Program Files\EffectCraft\effectcraft-cli.exe'
 $fc='C:\Program Files\FilmCraft\filmcraft-cli.exe'
 $ep=Join-Path $BundleRoot 'projects\01-emberwake-rta-v2.ecproj'
 $fp=Join-Path $BundleRoot 'projects\01-emberwake-rta-v2.fcproj'
 $q=Join-Path $BundleRoot 'qa\01-emberwake-rta-v2'
 Invoke-Native $ec @('--project',$ep,'--save','info','--json')
 Invoke-Native $fc @('--project',$fp,'--save','inspect')
 Invoke-Native $ec @('--project',$ep,'run','footage.check','{"wait":true}','footage.missing','{}','--json')
 Invoke-Native $fc @('--project',$fp,'exec','media.status')
 Invoke-Native $ec @('--project',$ep,'render-frame','--comp','EMBERWAKE RTA V2','--time','14','--out',(Join-Path $q 'delivery-effectcraft.png'),'--json')
 Invoke-Native $fc @('--project',$fp,'render','--seconds','14','--out',(Join-Path $q 'delivery-filmcraft.png'))
 Save-Receipt $true 'Native reopen/save/media-status/render completed from delivery folder'
} catch {
 Save-Receipt $false $_.Exception.Message
 Write-Error $_.Exception.Message
 exit 1
}
