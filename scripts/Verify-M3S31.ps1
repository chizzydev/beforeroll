# ASCII-only, PowerShell 5.1 compatible. No real .env or provider calls.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location $Root
try {
    Write-Host '===== SOURCE HASHES ====='
    & node.exe '.\scripts\verify-m3s31-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S31 source integrity FAILED.' }
    Write-Host '===== NODE VERSION ====='
    $NodeVersion = & node.exe --version
    if ([int]($NodeVersion.TrimStart('v').Split('.')[0]) -lt 20) { throw 'Node 20+ required.' }
    foreach ($File in @('server.mjs','src\local-env.mjs','public\workspace-desk.mjs','tests\m3s31-local-env.test.mjs')) {
        & node.exe --check $File
        if ($LASTEXITCODE -ne 0) { throw ('Syntax FAILED: '+$File) }
    }
    Write-Host '===== COMPLETE AUTOMATED REGRESSION ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Regression FAILED.' }
    Write-Host '===== FROZEN U01/U02/U03 PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Preflight FAILED.' }
    foreach ($Case in @('U01','U02')) {
        $Original = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Original
        if ($LASTEXITCODE -ne 0) { throw ('Frozen original case FAILED: '+$Case) }
    }
    Write-Host 'M3S31_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
} finally { Pop-Location }
