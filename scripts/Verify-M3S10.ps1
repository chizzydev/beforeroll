$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== M3-S10 NODE ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node unavailable' }

    Write-Host '===== M3-S10 AUTOMATED TESTS ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'M3-S10 automated tests failed' }

    Write-Host '===== FROZEN SCIENCE PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' --preflight
    if ($LASTEXITCODE -ne 0) { throw 'Frozen science preflight failed' }

    Write-Host '===== OWNER RECORDED U01 SCORE ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' --case U01 --input '.\fixtures\audit\M3S6_U01_OWNER_LIVE_EVIDENCE.json'
    if ($LASTEXITCODE -ne 0) { throw 'Original U01 score changed' }

    Write-Host '===== OWNER RECORDED U02 SCORE ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' --case U02 --input '.\fixtures\audit\M3S6_U02_OWNER_LIVE_EVIDENCE.json'
    if ($LASTEXITCODE -ne 0) { throw 'Original U02 score changed' }

    Write-Host 'M3S10_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally {
    Pop-Location
}
