# BeforeRoll M3-S11 Windows 5.1 / Node owner automated acceptance.
# This script does not start the GUI and never calls Clocked.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $Root
try {
    Write-Host '===== NODE / PROJECT ====='
    & node.exe --version
    if ($LASTEXITCODE -ne 0) { throw 'Node unavailable.' }
    Write-Host 'BEFOREROLL_ROOT=' $Root
    Write-Host '===== AUTOMATED SOURCE + API + BROWSER LOGIC ====='
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'M3-S11 automated tests failed.' }
    Write-Host '===== FROZEN SCIENCE PREFLIGHT ====='
    & node.exe '.\scripts\evaluate_m3s6.mjs' '--preflight'
    if ($LASTEXITCODE -ne 0) { throw 'Frozen U01/U02/U03 preflight failed.' }
    foreach ($Case in @('U01','U02')) {
        Write-Host ('===== FROZEN ORIGINAL {0} / READ ONLY =====' -f $Case)
        $Evidence = Join-Path $Root ('fixtures\audit\M3S6_{0}_OWNER_LIVE_EVIDENCE.json' -f $Case)
        if (!(Test-Path -LiteralPath $Evidence -PathType Leaf)) { throw ('Original {0} missing' -f $Case) }
        $Output = & node.exe '.\scripts\evaluate_m3s6.mjs' '--case' $Case '--input' $Evidence 2>&1
        $ExitCode = $LASTEXITCODE
        $Output | ForEach-Object { Write-Host $_ }
        if ($ExitCode -ne 0) { throw ('{0} scorer failed' -f $Case) }
        $Combined = ($Output | Out-String)
        if ($Combined -notmatch 'CHAMPIONSHIP_ASSERTIONS=5/5' -or $Combined -notmatch 'CHAMPIONSHIP_VERDICT=NARROW_SYNTHETIC_PASS') {
            throw ('{0} frozen case failed expected assertions' -f $Case)
        }
    }
    Write-Host 'M3S11_WINDOWS_OWNER_AUTOMATED_GATE=PASS'
}
finally { Pop-Location }
