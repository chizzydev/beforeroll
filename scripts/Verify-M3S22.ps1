# BeforeRoll M3-S22 Windows owner gate. PowerShell 5.1 ASCII-only.
# Cumulative automatic verification: no GUI and no billable Clocked calls.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== M3-S22 COMPLETE SOURCE SHA-256 CHECK ====='
    & node.exe '.\scripts\verify-m3s22-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S22 distribution integrity FAILED.' }
    Write-Host '===== NODE RUNTIME ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node runtime unavailable.' }
    Write-Host '===== INTEGRATION SYNTAX ====='
    foreach ($Source in @(
        'server.mjs',
        'src\source-originals.mjs',
        'src\reviewed-call-sheet.mjs',
        'src\production-workspace.mjs',
        'src\production-dossier.mjs',
        'src\production-lifecycle.mjs',
        'src\source-intake.mjs',
        'scripts\lifecycle-cli.mjs',
        'public\workspace-desk.mjs',
        'tests\m3s21-source-originals.test.mjs',
        'tests\m3s22-reviewed-call-sheet.test.mjs'
    )) {
        & node.exe --check $Source
        if ($LASTEXITCODE -ne 0) { throw ('Syntax FAILED: ' + $Source) }
    }
    Write-Host '===== CUMULATIVE OFFLINE ENGINEERING TESTS ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Offline engineering suite FAILED.' }
    Write-Host '===== ORIGINAL FROZEN U01/U02/U03 SOURCE PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Original science preflight FAILED.' }
    foreach ($Case in @('U01','U02')) {
        Write-Host ('===== ORIGINAL {0} CLOCKED EVIDENCE / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Original evidence missing: ' + $Case) }
        $Lines = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $Code = $LASTEXITCODE
        $Lines | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0) { throw ('Frozen scoring FAILED: ' + $Case) }
        $Result = $Lines | Out-String
        if ($Result -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Result -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') {
            throw ('Frozen scoring verdict changed: ' + $Case)
        }
    }
    Write-Host 'M3S22_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally { Pop-Location }
