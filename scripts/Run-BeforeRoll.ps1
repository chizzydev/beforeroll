param([switch]$Live, [int]$Port = 3000)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $Root 'server.mjs'))) { throw 'Server missing.' }
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw 'Install Node.js 20 or newer and reopen PowerShell.' }
Push-Location $Root
try {
    $env:PORT = [string]$Port
    $env:HOST = '127.0.0.1'
    if ($Live) {
        $Secret = Read-Host 'Paste your Clocked API key (input masked)' -AsSecureString
        $Credential = [System.Management.Automation.PSCredential]::new('local', $Secret)
        $env:CLOCKED_API_KEY = $Credential.GetNetworkCredential().Password
        $env:BEFOREROLL_OPERATOR_TOKEN = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
        $env:BEFOREROLL_LIVE_ENABLED = 'true'
        if (-not $env:CLOCKED_API_KEY) { throw 'Empty Clocked API key.' }
        Write-Host 'LIVE_OPERATOR_TOKEN=' -NoNewline
        Write-Host $env:BEFOREROLL_OPERATOR_TOKEN
        Write-Host 'Paste this separate operator token in Productions > Durable Clocked analysis, NOT your Clocked key.'
        Write-Host 'Live requests may consume credits. Local key stays server-side and is never printed.'
    } else {
        Remove-Item Env:CLOCKED_API_KEY -ErrorAction SilentlyContinue
        Remove-Item Env:BEFOREROLL_OPERATOR_TOKEN -ErrorAction SilentlyContinue
        $env:BEFOREROLL_LIVE_ENABLED = 'false'
        Write-Host 'REPLAY_ONLY=YES | NO_API_CREDITS'
    }
    Write-Host 'Owner access token appears in terminal after server starts. Paste it into the local Unlock screen.'
    Write-Host ('Open http://127.0.0.1:' + $Port + ' in your browser; Ctrl+C to stop.')
    node server.mjs
} finally {
    Remove-Item Env:CLOCKED_API_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:BEFOREROLL_OPERATOR_TOKEN -ErrorAction SilentlyContinue
    Remove-Item Env:BEFOREROLL_LIVE_ENABLED -ErrorAction SilentlyContinue
    Pop-Location
}
