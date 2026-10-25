param([string]$OutputFile='')
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false)
$proof=(& "$PSScriptRoot\Invoke-BioClick.ps1"|ConvertFrom-Json)
if($proof.mode -ne 'dry-run' -or $proof.inputSize -ne 40 -or $proof.flagsOffset -ne 20 -or $proof.pointerBytes -ne 8 -or $proof.inputApiCalled -or $proof.cursorOrFocusChanged){throw 'Dry-run contract failed'}
# Reproduce the old PowerShell nested value-type assignment without any Win32 call.
$oldDown=[ProjectPBioClick98+Input]::new();$oldDown.type=0;$oldDown.mouse.flags=2
$oldUp=[ProjectPBioClick98+Input]::new();$oldUp.type=0;$oldUp.mouse.flags=4
$old=@([BitConverter]::ToUInt32([ProjectPBioClick98]::Bytes($oldDown),20),[BitConverter]::ToUInt32([ProjectPBioClick98]::Bytes($oldUp),20))
$new=@($proof.events|ForEach-Object {$_.flags})
if($old.Count -ne 2 -or $old[0] -ne 0 -or $old[1] -ne 0 -or $new[0] -ne 2 -or $new[1] -ne 4){throw 'Expected old0/0 and corrected2/4 marshal bytes'}
if([ProjectPBioClick98]::InputCalls() -ne 0 -or [ProjectPBioClick98]::CursorCalls() -ne 0){throw 'Regression must not call any input or cursor API'}
$result=[pscustomobject]@{schemaVersion=1;checkedAt=[DateTime]::UtcNow.ToString('o');status='PASS_MEMORY_ONLY_REGRESSION';helperSha256=(Get-FileHash -Algorithm SHA256 -LiteralPath "$PSScriptRoot\Invoke-BioClick.ps1").Hash.ToLowerInvariant();oldNestedAssignmentFlags=$old;correctedFactoryFlags=$new;dryRun=$proof;inputApiCalls=[ProjectPBioClick98]::InputCalls();cursorApiCalls=[ProjectPBioClick98]::CursorCalls();focusChanged=$false;nativeProfileSave='not_tested'}
$json=($result|ConvertTo-Json -Depth 6).Replace("`r`n","`n")
if($OutputFile){[IO.File]::WriteAllText($OutputFile,$json+"`n",[Text.UTF8Encoding]::new($false))}
$json
