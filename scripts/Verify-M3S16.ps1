# PowerShell 5.1 compatible, ASCII-only. Read-only testing, no GUI/provider calls.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== M3-S16 DISTRIBUTION FILE INTEGRITY ====='
    & node.exe '.\scripts\verify-m3s16-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S16 source manifest FAILED.' }
    Write-Host '===== NODE RUNTIME ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node unavailable.' }
    Write-Host '===== INTEGRATED SOURCE SYNTAX ====='
    foreach ($Source in @('server.mjs', 'src\production-dossier.mjs', 'src\production-workspace.mjs', 'src\intelligence-workflow.mjs', 'src\durable-execution.mjs', 'src\document-authority.mjs', 'src\scene-authority.mjs', 'src\production-operations.mjs', 'public\workspace-desk.mjs', 'tests\m3s16-integrated-dossier.test.mjs')) {
        & node.exe --check $Source
        if ($LASTEXITCODE -ne 0) { throw ('Source syntax FAILED: ' + $Source) }
    }
    Write-Host '===== COMPLETE AUTOMATED ENGINEERING SUITE ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'M3-S16 automated suite FAILED.' }
    Write-Host '===== ORIGINAL FROZEN U01/U02/U03 PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Original frozen preflight FAILED.' }
    foreach ($Case in @('U01', 'U02')) {
        Write-Host ('===== ORIGINAL {0} CLOCKED RECORDING / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Original owner evidence missing: ' + $Case) }
        $Lines = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $Code = $LASTEXITCODE
        $Lines | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0) { throw ('Original Clocked result scoring FAILED: ' + $Case) }
        $Text = $Lines | Out-String
        if ($Text -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Text -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') { throw ('Original result scoring drifted: ' + $Case) }
    }
    Write-Host 'M3S16_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally { Pop-Location }
