@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Configure-Private.ps1"
if errorlevel 1 (
  echo.
  echo Could not configure private mode.
  pause
)
endlocal
