# BeforeRoll M3-S12 Windows PowerShell 5.1/Node bulk engineering owner gate.
# This script NEVER calls Clocked and NEVER starts the Windows GUI.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== BEFORE ROLL M3-S12 BULK ENGINEERING ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node is unavailable.' }
    Write-Host ('APPLICATION_ROOT=' + $Root)
    Write-Host '===== SYNTAX GATES ====='
    foreach ($Source in @('server.mjs', 'src\durable-execution.mjs', 'src\production-review.mjs', 'public\workspace-desk.mjs')) {
        & node.exe --check $Source
        if ($LASTEXITCODE -ne 0) { throw ('Source syntax invalid: ' + $Source) }
    }
    Write-Host '===== FULL AUTOMATED TEST SUITE ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'M3-S12 tests failed.' }
    Write-Host '===== FROZEN U01/U02/U03 PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Frozen source preflight failed.' }
    foreach ($Case in @('U01', 'U02')) {
        Write-Host ('===== ORIGINAL {0} / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Original U0 file not found: ' + $Case) }
        $Output = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $ExitCode = $LASTEXITCODE
        $Output | ForEach-Object { Write-Host $_ }
        if ($ExitCode -ne 0) { throw ('Frozen ' + $Case + ' scorer failed.') }
        $Combined = ($Output | Out-String)
        if ($Combined -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Combined -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') {
            throw ('Frozen science check failed: ' + $Case)
        }
    }
    Write-Host 'M3S12_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally {
    Pop-Location
}
