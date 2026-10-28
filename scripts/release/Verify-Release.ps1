param([switch]$NoLaunch)
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PriorLive = $env:BEFOREROLL_LIVE_ENABLED
$env:BEFOREROLL_LIVE_ENABLED = 'false'
Push-Location -LiteralPath $ProjectRoot
try {
    & node.exe scripts/release/verify-distribution.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Public distribution inventory failed.' }
    & node.exe scripts/verify-coordinator-evidence.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Historical source/receipt verification failed.' }
    & node.exe scripts/verify-last-light-recording.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Last Light recording verification failed.' }
    & node.exe scripts/release/test-public.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Public application regression failed.' }
    & node.exe --test experiments/p0b/stage0.test.mjs experiments/p0b/stage1/stage1.test.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Frozen harness regression failed.' }
    Write-Host 'Public release scope PASS. Protected archive integrity remains a separate local gate. Zero new Clocked calls.'
    if (-not $NoLaunch) { & (Join-Path $ProjectRoot 'scripts/Launch-Evaluation.ps1') }
} finally {
    Pop-Location
    if ($null -eq $PriorLive) { Remove-Item Env:BEFOREROLL_LIVE_ENABLED -ErrorAction SilentlyContinue }
    else { $env:BEFOREROLL_LIVE_ENABLED = $PriorLive }
}
