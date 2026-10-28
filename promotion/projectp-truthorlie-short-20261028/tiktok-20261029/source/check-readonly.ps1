param([string]$Path = (Join-Path $PSScriptRoot 'read-own-window.ps1'))
$ErrorActionPreference = 'Stop'
$tokens = $null
$errors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile($Path, [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw ($errors | ForEach-Object {$_.Message} | Out-String) }
$commandAllow = @('Set-StrictMode','Get-Content','ConvertFrom-Json','Get-Process','Guard',
    'Add-Type','Assert-Window','Elements-OfType','Read-Tabs','Where-Object','Select-Object',
    'Get-FileHash','ConvertTo-Json')
$methodAllow = @('new','StartNew','Parse','AddSeconds','ToUniversalTime','ToString',
    'GetCurrentProcess','GetWindowThreadProcessId','IsWindow','FindAll','GetRuntimeId',
    'GetCurrentPattern','ForPid','FromHandle','ToLowerInvariant')
$commands = @($ast.FindAll({param($n) $n -is [Management.Automation.Language.CommandAst]}, $true))
$methods = @($ast.FindAll({param($n) $n -is [Management.Automation.Language.InvokeMemberExpressionAst]}, $true))
foreach ($c in $commands) {
    if (-not $c.GetCommandName() -or $commandAllow -notcontains $c.GetCommandName()) { throw 'Unexpected command in read-only helper' }
}
foreach ($m in $methods) {
    if ($m.Member -isnot [Management.Automation.Language.StringConstantExpressionAst] -or
        $methodAllow -notcontains $m.Member.Value) { throw 'Unexpected method in read-only helper' }
}
$source = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
$imports = @([regex]::Matches($source, '\[DllImport\("user32\.dll"\)\]\s+(?:private|public) static extern \w+ (\w+)\(') | ForEach-Object {$_.Groups[1].Value})
$importAllow = @('EnumWindows','IsWindowVisible','GetClassName','IsWindow','GetWindowThreadProcessId')
if ($imports.Count -ne 5 -or @($imports | Where-Object {$importAllow -notcontains $_}).Count) { throw 'Unexpected Win32 imports' }
[pscustomobject]@{
    helperSha256=(Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
    parseErrors=0
    commandNames=@($commands | ForEach-Object {$_.GetCommandName()} | Sort-Object -Unique)
    methodNames=@($methods | ForEach-Object {$_.Member.Value} | Sort-Object -Unique)
    win32Imports=$imports
    helperExecuted=$false
    desktopObservation=$false
    scope='Static AST/import allowlist and syntax; not a runtime or complete security proof'
} | ConvertTo-Json -Depth 4
