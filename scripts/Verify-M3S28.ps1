# BeforeRoll M3-S28 Windows PowerShell 5.1 cumulative automated verification.
# ASCII-only, no GUI, no live API calls, no mutation of owner workspaces.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== M3-S28 DISTRIBUTION INTEGRITY ====='
    & node.exe '.\scripts\verify-m3s28-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S28 distribution integrity FAILED' }
    Write-Host '===== NODE VERSION ====='
    $NodeVersion = & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node version FAILED' }
    Write-Host $NodeVersion
    $NodeMajor = [int]($NodeVersion.TrimStart('v').Split('.')[0])
    if ($NodeMajor -lt 20) { throw 'Node 20+ required' }
    Write-Host '===== M3-S28 SOURCE SYNTAX ====='
    foreach ($Source in @(
        'server.mjs',
        'src\production-consistency.mjs',
        'src\production-workspace.mjs',
        'src\intelligence-workflow.mjs',
        'src\production-dossier.mjs',
        'src\durable-execution.mjs',
        'src\source-change-control.mjs',
        'src\scene-workbench.mjs',
        'src\production-actions.mjs',
        'public\workspace-desk.mjs',
        'tests\m3s28-production-consistency.test.mjs'
    )) {
        & node.exe --check $Source
        if ($LASTEXITCODE -ne 0) { throw ('Syntax FAILED: ' + $Source) }
    }
    Write-Host '===== CUMULATIVE NODE TESTS ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'M3-S28 cumulative tests FAILED' }
    Write-Host '===== FROZEN U01/U02/U03 SOURCE PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Frozen source preflight FAILED' }
    foreach ($Case in @('U01','U02')) {
        Write-Host ('===== ORIGINAL {0} CLOCKED EVIDENCE / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Original owner evidence missing: ' + $Case) }
        $Lines = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $Code = $LASTEXITCODE
        $Lines | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0) { throw ('Frozen original evidence score FAILED: ' + $Case) }
        $Score = $Lines | Out-String
        if ($Score -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Score -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') {
            throw ('Frozen original evidence changed: ' + $Case)
        }
    }
    Write-Host 'M3S28_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally { Pop-Location }
