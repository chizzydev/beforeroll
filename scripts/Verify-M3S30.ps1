# M3-S30 cumulative engineering verification. ASCII-only PowerShell 5.1.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location $Root
try {
    Write-Host '===== SOURCE INTEGRITY ====='
    & node.exe '.\scripts\verify-m3s30-source.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'M3-S30 source integrity failed' }
    $Version = & node.exe --version
    if ([int]($Version.TrimStart('v').Split('.')[0]) -lt 20) { throw 'Node 20+ required' }
    foreach ($File in @('server.mjs', 'public\app.js', 'src\evaluation-mode.mjs', 'src\intelligence-workflow.mjs', 'src\durable-execution.mjs', 'tests\m3s30-evaluation-mode.test.mjs')) {
        & node.exe --check $File
        if ($LASTEXITCODE -ne 0) { throw ('Syntax check failed: '+$File) }
    }
    Write-Host '===== ISOLATED EVALUATION SECURITY AND EXPERIENCE ====='
    & node.exe --test '.\tests\m3s30-evaluation-mode.test.mjs'
    if ($LASTEXITCODE -ne 0) { throw 'Evaluation security tests failed' }
    Write-Host '===== COMPLETE ENGINEERING REGRESSION ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Complete regression failed' }
    Write-Host '===== ORIGINAL FROZEN SOURCE PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Frozen preflight failed' }
    foreach ($Case in @('U01','U02')) {
        $Original = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        $Lines = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Original 2>&1
        $Code = $LASTEXITCODE
        $Lines | ForEach-Object { Write-Host $_ }
        if ($Code -ne 0 -or ($Lines | Out-String) -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5') {
            throw ('Frozen scientific regression failed: '+$Case)
        }
    }
    Write-Host 'M3S30_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
} finally { Pop-Location }
