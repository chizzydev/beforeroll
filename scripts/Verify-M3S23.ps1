# BeforeRoll M3-S23 owner Windows test gate. PowerShell 5.1 ASCII only.
# No GUI. No paid Clocked calls. Does not modify user workspaces.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== M3-S23 DISTRIBUTION SHA-256 ====='
    & node.exe '.\scripts\verify-m3s23-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S23 source integrity FAILED.' }
    Write-Host '===== NODE VERSION ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node runtime unavailable.' }
    Write-Host '===== SYNTAX ====='
    foreach ($Source in @(
        'server.mjs',
        'src\source-change-control.mjs',
        'public\workspace-desk.mjs',
        'tests\m3s23-source-reconciliation.test.mjs',
        'scripts\verify-m3s23-source.mjs'
    )) {
        & node.exe --check $Source
        if ($LASTEXITCODE -ne 0) { throw ('Syntax FAILED: ' + $Source) }
    }
    Write-Host '===== COMPLETE OFFLINE TEST SUITE ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'M3-S23 automated tests FAILED.' }
    Write-Host '===== FROZEN U01/U02/U03 SOURCE PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Frozen source preflight FAILED.' }
    foreach ($Case in @('U01','U02')) {
        Write-Host ('===== ORIGINAL {0} OWNER RECORDING / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Frozen evidence missing: ' + $Case) }
        $Lines = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $Code = $LASTEXITCODE
        $Lines | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0) { throw ('Original Clocked score FAILED: ' + $Case) }
        $Verdict = $Lines | Out-String
        if ($Verdict -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Verdict -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') {
            throw ('Original Clocked score verdict changed: ' + $Case)
        }
    }
    Write-Host 'M3S23_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally { Pop-Location }
