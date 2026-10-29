param(
    [Parameter(Mandatory=$true)][string]$SourceFolder,
    [Parameter(Mandatory=$true)][string]$DestinationFolder,
    [Parameter(Mandatory=$true)][string]$ReceiptFile
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
if (-not (Test-Path -LiteralPath $DestinationFolder -PathType Container)) { throw 'NAS gara directory is unavailable' }
$items = @(
    @{Source='OsayuPukuJelly-SBIX.ttf'; Name='おさゆ_ぷくシール_色付き_v2.ttf'},
    @{Source='OsayuPukuJelly-COLR0.ttf'; Name='おさゆ_ぷくシール_色付き互換_v2.ttf'},
    @{Source='見本.png'; Name='おさゆ_ぷくシール_見本_v2.png'},
    @{Source='はじめに.txt'; Name='おさゆ_ぷくシール_使い方_v2.txt'}
)
$licenseFolderName = 'おさゆ_ぷくシール_v2_ライセンス'
$licenseDestination = Join-Path $DestinationFolder $licenseFolderName
foreach ($license in @('OFL-CherryBombOne.txt','OFL-MochiyPopOne.txt','OFL-ZenMaruGothic.txt')) {
    $items += @{Source=$license; Name=(Join-Path $licenseFolderName $license)}
}
foreach ($item in $items) {
    if (-not (Test-Path -LiteralPath (Join-Path $SourceFolder $item.Source) -PathType Leaf)) { throw "Missing source: $($item.Source)" }
}
if (-not (Test-Path -LiteralPath $licenseDestination)) { New-Item -ItemType Directory -Path $licenseDestination | Out-Null }
$report = @()
foreach ($item in $items) {
    $source = Join-Path $SourceFolder $item.Source
    $destination = Join-Path $DestinationFolder $item.Name
    $before = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
    if (Test-Path -LiteralPath $destination) {
        if ((Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash -ne $before) {
            throw "A different delivery already exists: $($item.Name)"
        }
    } else {
        Copy-Item -LiteralPath $source -Destination $destination
    }
    $after = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
    if ($before -ne $after) { throw "NAS copy mismatch: $($item.Name)" }
    $report += @{Name=$item.Name; Bytes=(Get-Item -LiteralPath $destination).Length; SHA256=$after; Match=$true}
}
$json = @{CheckedAt=(Get-Date).ToUniversalTime().ToString('o'); Files=$report} | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($ReceiptFile,$json,[System.Text.UTF8Encoding]::new($false))
Write-Output $json
