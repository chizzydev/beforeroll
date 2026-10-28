param([switch]$NoLaunch)
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PriorLiveSetting = $env:BEFOREROLL_LIVE_ENABLED
$env:BEFOREROLL_LIVE_ENABLED = 'false'
Push-Location -LiteralPath $ProjectRoot
try {
    & node.exe scripts/verify-coordinator-evidence.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Historical evidence preflight failed.' }
    & node.exe scripts/verify-last-light-recording.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Last Light recording or current projector failed.' }
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Native regression failed.' }
    & node.exe --test experiments/p0b/stage0.test.mjs experiments/p0b/stage1/stage1.test.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Frozen network-free harness regression failed.' }
    Write-Host 'Last Light automated gate PASS. Zero new provider requests. Independent owner GUI acceptance remains pending.'
    if (-not $NoLaunch) { & (Join-Path $PSScriptRoot 'Launch-Evaluation.ps1') }
} finally {
    Pop-Location
    if ($null -eq $PriorLiveSetting) { Remove-Item Env:BEFOREROLL_LIVE_ENABLED -ErrorAction SilentlyContinue }
    else { $env:BEFOREROLL_LIVE_ENABLED = $PriorLiveSetting }
}
