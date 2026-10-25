# ASCII-only PowerShell 5.1. Does not ask for or print the API key.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$File = Join-Path $Root '.env'
function Make-Token {
    $Bytes = New-Object byte[] 32
    $Rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $Rng.GetBytes($Bytes) } finally { $Rng.Dispose() }
    return ([System.BitConverter]::ToString($Bytes)).Replace('-', '').ToLowerInvariant()
}
if (-not (Test-Path -LiteralPath $File -PathType Leaf)) {
    $Lines = @(
        '# Local private BeforeRoll configuration. Never upload or commit this file.',
        'HOST=127.0.0.1',
        'PORT=3000',
        '# Paste your Clocked API key after the equals sign; never into the browser.',
        'CLOCKED_API_KEY=',
        '# Switch this to true ONLY to authorize live owner-mode capability.',
        'BEFOREROLL_LIVE_ENABLED=false',
        ('BEFOREROLL_OWNER_TOKEN=' + (Make-Token)),
        ('BEFOREROLL_OPERATOR_TOKEN=' + (Make-Token)),
        'BEFOREROLL_MAX_CALLS_PER_HOUR=256'
    )
    [System.IO.File]::WriteAllLines($File, $Lines, [System.Text.UTF8Encoding]::new($false))
    Write-Host 'Private local .env created. Separate owner and operator secrets generated.'
} else {
    Write-Host 'Existing .env preserved. No secrets overwritten.'
}
Write-Host 'Notepad will open .env. For live Clocked calls, enter CLOCKED_API_KEY and change BEFOREROLL_LIVE_ENABLED to true.'
Write-Host 'Keep .env local. Use owner token to unlock in browser and operator token to explicitly authorize live calls.'
Start-Process -FilePath notepad.exe -ArgumentList ('"' + $File + '"')
