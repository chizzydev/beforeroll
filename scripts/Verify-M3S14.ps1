# PowerShell 5.1 compatible. ASCII-only, read-only automated engineering gate.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== BEFORE ROLL M3-S14 SOURCE INTEGRITY ====='
    & node.exe '.\scripts\verify-m3s14-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S14 integrity manifest verification failed.' }
    Write-Host '===== SYNTAX / NODE RUNTIME ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node unavailable.' }
    foreach ($Source in @('server.mjs', 'src\docx-intake.mjs', 'src\pdf-intake.mjs', 'src\scene-authority.mjs', 'src\document-authority.mjs', 'src\production-workspace.mjs', 'src\source-intake.mjs', 'public\workspace-desk.mjs', 'public\app.js')) {
        & node.exe --check $Source
        if ($LASTEXITCODE -ne 0) { throw ('Source syntax failed: ' + $Source) }
    }
    Write-Host '===== FULL AUTOMATED TEST SUITE ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'M3-S14 tests failed.' }
    Write-Host '===== FROZEN U01/U02/U03 PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Frozen preflight failed.' }
    foreach ($Case in @('U01','U02')) {
        Write-Host ('===== FROZEN ORIGINAL {0} / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Missing original evidence: '+$Case) }
        $Output = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $Code = $LASTEXITCODE
        $Output | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0) { throw ('Frozen scorer failed: '+$Case) }
        $Combined = $Output | Out-String
        if ($Combined -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Combined -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') { throw ('Frozen scientific assertion changed: '+$Case) }
    }
    Write-Host 'M3S14_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally { Pop-Location }
