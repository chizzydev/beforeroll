# BeforeRoll M3-S17 Windows PowerShell 5.1 verifier. ASCII-only, read-only.
# No GUI, no provider key, no Clocked requests, no workspace mutations.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== M3-S17 FULL DISTRIBUTION SHA-256 ====='
    & node.exe '.\scripts\verify-m3s17-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S17 distribution integrity FAILED.' }

    Write-Host '===== NODE RUNTIME ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node runtime unavailable.' }

    Write-Host '===== NEW INTEGRATED SOURCE SYNTAX ====='
    foreach ($Source in @(
        'server.mjs',
        'src\production-actions.mjs',
        'src\source-change-control.mjs',
        'src\production-dossier.mjs',
        'src\production-workspace.mjs',
        'src\durable-execution.mjs',
        'public\workspace-desk.mjs',
        'tests\m3s17-actionable-production.test.mjs'
    )) {
        & node.exe --check $Source
        if ($LASTEXITCODE -ne 0) { throw ('Syntax check FAILED: ' + $Source) }
    }

    Write-Host '===== CUMULATIVE OFFLINE ENGINEERING SUITE ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Automated suite FAILED.' }

    Write-Host '===== ORIGINAL FROZEN U01/U02/U03 PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Original science source preflight FAILED.' }

    foreach ($Case in @('U01','U02')) {
        Write-Host ('===== ORIGINAL {0} CLOCKED EVIDENCE SCORE / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Original owner evidence is missing: ' + $Case) }
        $Lines = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $Code = $LASTEXITCODE
        $Lines | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0) { throw ('Original evidence scoring FAILED: ' + $Case) }
        $Result = $Lines | Out-String
        if ($Result -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Result -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') {
            throw ('Original frozen Clocked result changed: ' + $Case)
        }
    }

    Write-Host 'M3S17_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally { Pop-Location }
