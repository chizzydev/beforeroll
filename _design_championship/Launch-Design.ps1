$ErrorActionPreference = 'Stop'
$designRoot = $PSScriptRoot
$designUrl = 'http://127.0.0.1:3044/'
$designReady = $false
try {
    $designResponse = Invoke-WebRequest -Uri $designUrl -UseBasicParsing -TimeoutSec 2
    $designReady = $designResponse.Content.Contains('BeforeRoll') -and $designResponse.Content.Contains('prototype.js')
} catch { }
if (-not $designReady) {
    $designNode = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $designNode -ArgumentList 'prototypes/serve.mjs' -WorkingDirectory $designRoot -WindowStyle Hidden
    for ($designAttempt = 0; $designAttempt -lt 20; $designAttempt++) {
        Start-Sleep -Milliseconds 200
        try {
            $designResponse = Invoke-WebRequest -Uri $designUrl -UseBasicParsing -TimeoutSec 1
            if ($designResponse.Content.Contains('prototype.js')) { $designReady = $true; break }
        } catch { }
    }
}
if (-not $designReady) { throw 'The local design prototype could not open on port 3044. No production data was changed.' }
Start-Process $designUrl
