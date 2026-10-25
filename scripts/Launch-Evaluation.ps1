# Double-click launcher backing script. No secrets, no API requests, no terminal input.
# Windows PowerShell 5.1 compatible and ASCII only.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Node = (Get-Command node.exe -ErrorAction Stop).Source
$Version = & $Node --version
if ([int]($Version.TrimStart('v').Split('.')[0]) -lt 20) { throw 'Install Node.js 20 or later.' }
$PortProbe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$PortProbe.Start()
$Port = $PortProbe.LocalEndpoint.Port
$PortProbe.Stop()
$Address = 'http://127.0.0.1:' + $Port
$env:HOST = '127.0.0.1'
$env:PORT = [string]$Port
$env:BEFOREROLL_LIVE_ENABLED = 'false'
Remove-Item Env:CLOCKED_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:BEFOREROLL_OPERATOR_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:BEFOREROLL_OWNER_TOKEN -ErrorAction SilentlyContinue
Write-Host 'BeforeRoll - Interactive Evaluation' -ForegroundColor Cyan
Write-Host 'Generated examples only. No login, no API key, no personal documents.'
Write-Host ('The browser will open at ' + $Address)
Write-Host 'Keep this launcher window open while using BeforeRoll.'
$Proc = $null
try {
    $Proc = Start-Process -FilePath $Node -ArgumentList @('server.mjs', '--evaluate') -WorkingDirectory $Root -PassThru -NoNewWindow
    $Ready = $false
    for ($Attempt = 0; $Attempt -lt 75; $Attempt++) {
        if ($Proc.HasExited) { throw 'Evaluation server exited before opening the browser.' }
        try {
            $Response = Invoke-RestMethod -Uri ($Address + '/api/health') -TimeoutSec 2 -ErrorAction Stop
            if ($Response.evaluationMode -eq $true -and $Response.liveEnabled -eq $false -and $Response.ownerAccessRequired -eq $false) {
                $Ready = $true
                break
            }
        } catch {}
        Start-Sleep -Milliseconds 200
    }
    if (-not $Ready) { throw 'Evaluation server health check failed. Browser not opened.' }
    Start-Process $Address
    Write-Host 'Evaluation is running. Close this window or press Ctrl+C to end.' -ForegroundColor Green
    Wait-Process -Id $Proc.Id
} finally {
    if ($Proc -and -not $Proc.HasExited) { Stop-Process -Id $Proc.Id -Force -ErrorAction SilentlyContinue }
    Remove-Item Env:BEFOREROLL_LIVE_ENABLED -ErrorAction SilentlyContinue
    Remove-Item Env:PORT -ErrorAction SilentlyContinue
    Remove-Item Env:HOST -ErrorAction SilentlyContinue
}
