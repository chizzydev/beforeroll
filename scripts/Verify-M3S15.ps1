# PowerShell 5.1 compatible. ASCII only. Non-mutating test of frozen source archive.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== M3-S15 BUNDLE SOURCE INTEGRITY ====='
    & node.exe '.\scripts\verify-m3s15-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S15 source integrity FAILED.' }
    Write-Host '===== NODE RUNTIME ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node unavailable.' }
    Write-Host '===== SOURCE SYNTAX ====='
    foreach ($Source in @('server.mjs', 'src\production-operations.mjs', 'src\production-review.mjs', 'src\production-workspace.mjs', 'src\workspace-store.mjs', 'src\pdf-intake.mjs', 'src\scene-authority.mjs', 'public\workspace-desk.mjs', 'public\app.js')) {
        & node.exe --check $Source
        if ($LASTEXITCODE -ne 0) { throw ('Source syntax FAILED: ' + $Source) }
    }
    Write-Host '===== COMPLETE AUTOMATED ENGINEERING SUITE ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'M3-S15 automated tests FAILED.' }
    Write-Host '===== FROZEN U01/U02/U03 SOURCE PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Frozen source preflight FAILED.' }
    foreach ($Case in @('U01','U02')) {
        Write-Host ('===== ORIGINAL {0} CLOCKED RECORDING / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Original source evidence missing: ' + $Case) }
        $Lines = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $Code = $LASTEXITCODE
        $Lines | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0) { throw ('Original scorer FAILED: ' + $Case) }
        $Text = $Lines | Out-String
        if ($Text -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Text -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') { throw ('Original evidence scored differently: ' + $Case) }
    }
    Write-Host 'M3S15_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally { Pop-Location }
