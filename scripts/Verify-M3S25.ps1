# BeforeRoll M3-S25 cumulative owner automated verification.
# PowerShell 5.1 ASCII only, no GUI, no keys and no live API calls.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== M3-S25 COMPLETE DISTRIBUTION SHA-256 ====='
    & node.exe '.\scripts\verify-m3s25-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S25 source integrity FAILED.' }
    Write-Host '===== NODE VERSION ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node 20 or later is required.' }
    Write-Host '===== NEW COMPONENT SYNTAX ====='
    foreach ($Source in @(
        'server.mjs',
        'src\source-intake.mjs',
        'src\reviewed-permit.mjs',
        'src\document-preview.mjs',
        'src\practical-pdf.mjs',
        'src\docx-intake.mjs',
        'src\reviewed-call-sheet.mjs',
        'src\production-workspace.mjs',
        'src\production-dossier.mjs',
        'public\workspace-desk.mjs',
        'tests\m3s25-real-documents.test.mjs',
        'scripts\verify-m3s25-source.mjs'
    )) {
        & node.exe --check $Source
        if ($LASTEXITCODE -ne 0) { throw ('Syntax FAILED: ' + $Source) }
    }
    Write-Host '===== CUMULATIVE OFFLINE TEST SUITE ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'M3-S25 automated tests FAILED.' }
    Write-Host '===== ORIGINAL FROZEN U01/U02/U03 PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Frozen original preflight FAILED.' }
    foreach ($Case in @('U01','U02')) {
        Write-Host ('===== ORIGINAL {0} CLOCKED OWNER EVIDENCE / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Original owner evidence missing: ' + $Case) }
        $Lines = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $Code = $LASTEXITCODE
        $Lines | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0) { throw ('Original score failed: ' + $Case) }
        $Verdict = $Lines | Out-String
        if ($Verdict -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Verdict -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') {
            throw ('Original sponsor evidence verdict changed: ' + $Case)
        }
    }
    Write-Host 'M3S25_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally { Pop-Location }
