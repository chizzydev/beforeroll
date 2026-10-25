# BeforeRoll M3-S26 Windows PowerShell 5.1-compatible cumulative engineering gate.
# No GUI, no Clocked key, no network provider calls; preserves all owner workspaces.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== M3-S26 EXACT DISTRIBUTION SHA-256 ====='
    & node.exe '.\scripts\verify-m3s26-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S26 source integrity FAILED' }
    Write-Host '===== NODE VERSION ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node 20 or later is required' }
    Write-Host '===== M3-S26 SOURCE SYNTAX ====='
    foreach ($Source in @(
        'server.mjs',
        'src\scene-authority.mjs',
        'src\documentary-reasoning.mjs',
        'src\production-dossier.mjs',
        'src\production-actions.mjs',
        'src\production-journey.mjs',
        'src\scene-workbench.mjs',
        'public\workspace-desk.mjs',
        'tests\m3s26-documentary-reasoning.test.mjs',
        'scripts\verify-m3s26-source.mjs'
    )) {
        & node.exe --check $Source
        if ($LASTEXITCODE -ne 0) { throw ('Syntax FAILED: ' + $Source) }
    }
    Write-Host '===== CUMULATIVE AUTOMATED TEST SUITE ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'M3-S26 cumulative tests FAILED' }
    Write-Host '===== ORIGINAL FROZEN U01/U02/U03 PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Frozen source preflight FAILED' }
    foreach ($Case in @('U01','U02')) {
        Write-Host ('===== ORIGINAL {0} CLOCKED EVIDENCE / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Original owner evidence missing: ' + $Case) }
        $Lines = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $Code = $LASTEXITCODE
        $Lines | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0) { throw ('Frozen evidence score FAILED: ' + $Case) }
        $Verdict = $Lines | Out-String
        if ($Verdict -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Verdict -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') {
            throw ('Frozen evidence changed: ' + $Case)
        }
    }
    Write-Host 'M3S26_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally { Pop-Location }
