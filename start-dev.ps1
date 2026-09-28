$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'
$backendPython = Join-Path $backendDir '.venv\Scripts\python.exe'

if (-not (Test-Path $backendPython)) {
    throw "Backend virtual environment not found at $backendPython. Create it first with: python -m venv .venv"
}

$npmCommand = (Get-Command npm.cmd -ErrorAction Stop).Source

Write-Host "Starting Smart Campus backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$backendDir'; & '$backendPython' run.py"
) -WorkingDirectory $root

Start-Sleep -Seconds 3

Write-Host "Starting Smart Campus frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$frontendDir'; & '$npmCommand' run dev"
) -WorkingDirectory $root

Write-Host "`nBoth services launched." -ForegroundColor Green
Write-Host "Backend: http://127.0.0.1:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://127.0.0.1:5173" -ForegroundColor Yellow
Write-Host "`nUse Ctrl+C in each terminal window to stop the services." -ForegroundColor Gray
