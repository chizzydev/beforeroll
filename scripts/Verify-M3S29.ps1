# BeforeRoll M3-S29 Windows PowerShell 5.1 owner automated security gate.
# ASCII-only. No owner workspace writes or live Clocked calls.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== M3-S29 DISTRIBUTION INTEGRITY ====='
    & node.exe '.\scripts\verify-m3s29-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S29 source integrity FAILED' }
    $Version = & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node runtime FAILED' }
    Write-Host ('NODE=' + $Version)
    if ([int]($Version.TrimStart('v').Split('.')[0]) -lt 20) { throw 'Node 20+ required' }
    Write-Host '===== SOURCE SYNTAX ====='
    foreach ($File in @('server.mjs','src\owner-security.mjs','src\secure-backup.mjs','src\privacy-retention.mjs','scripts\lifecycle-cli.mjs','scripts\retention-cli.mjs','public\workspace-desk.mjs','tests\m3s29-owner-security.test.mjs')) {
        & node.exe --check $File
        if ($LASTEXITCODE -ne 0) { throw ('Syntax check FAILED: ' + $File) }
    }
    Write-Host '===== M3-S29 SECURITY/RECOVERY REGRESSIONS ====='
    & node.exe --test '.\tests\m3s29-owner-security.test.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'Security test FAILED' }
    Write-Host '===== COMPLETE AUTOMATED SUITE ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Cumulative tests FAILED' }
    Write-Host '===== FROZEN SOURCE PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Frozen preflight FAILED' }
    foreach ($Case in @('U01','U02')) {
        Write-Host ('===== ORIGINAL ' + $Case + ' CLOCKED EVIDENCE / READ ONLY =====')
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Original frozen evidence missing ' + $Case) }
        $Lines = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $Code = $LASTEXITCODE
        $Lines | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0) { throw ('Frozen Clocked regression FAILED ' + $Case) }
        $Result = $Lines | Out-String
        if ($Result -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Result -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') { throw ('Frozen score changed ' + $Case) }
    }
    Write-Host 'M3S29_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
} finally { Pop-Location }
