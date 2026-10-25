@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Launch-Evaluation.ps1"
if errorlevel 1 (
  echo.
  echo BeforeRoll could not start. Check that Node.js 20+ is installed.
  pause
)
endlocal
