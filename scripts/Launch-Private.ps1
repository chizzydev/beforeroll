# One-click local private mode; Node loads .env itself. ASCII-only PowerShell 5.1.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$File = Join-Path $Root '.env'
if (-not (Test-Path -LiteralPath $File -PathType Leaf)) {
    throw 'Private .env missing. Double-click Configure-BeforeRoll-Private.cmd first.'
}
$Node = (Get-Command node.exe -ErrorAction Stop).Source
$Version = & $Node --version
if ([int]($Version.TrimStart('v').Split('.')[0]) -lt 20) { throw 'Node.js 20+ required.' }
$Probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$Probe.Start(); $Port = $Probe.LocalEndpoint.Port; $Probe.Stop()
$Address = 'http://127.0.0.1:' + $Port
$env:HOST = '127.0.0.1'
$env:PORT = [string]$Port
Write-Host 'BeforeRoll - Private Production' -ForegroundColor Cyan
Write-Host 'Credentials are read server-side from your local .env. No Clocked key is printed.'
Write-Host 'If live mode is enabled, an owner session and a separate operator token still protect billable requests.'
$Proc = $null
try {
    $Proc = Start-Process -FilePath $Node -ArgumentList @('server.mjs') -WorkingDirectory $Root -PassThru -NoNewWindow
    $Ready = $false
    for ($Attempt = 0; $Attempt -lt 75; $Attempt++) {
        if ($Proc.HasExited) { throw 'Server stopped. Verify the private .env configuration.' }
        try {
            $Check = Invoke-RestMethod -Uri ($Address + '/api/health') -TimeoutSec 2 -ErrorAction Stop
            if ($Check.mode -eq 'local-owner-production' -and $Check.ownerAccessRequired -eq $true) { $Ready = $true; break }
        } catch {}
        Start-Sleep -Milliseconds 200
    }
    if (-not $Ready) { throw 'Private server health check failed.' }
    Start-Process $Address
    Write-Host 'Private browser opened. Close this window to stop the server.' -ForegroundColor Green
    Wait-Process -Id $Proc.Id
} finally {
    if ($Proc -and -not $Proc.HasExited) { Stop-Process -Id $Proc.Id -Force -ErrorAction SilentlyContinue }
    Remove-Item Env:PORT -ErrorAction SilentlyContinue
    Remove-Item Env:HOST -ErrorAction SilentlyContinue
}
