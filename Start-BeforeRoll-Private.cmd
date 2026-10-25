@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Launch-Private.ps1"
if errorlevel 1 (
  echo.
  echo BeforeRoll private launch failed. Check the messages above.
  pause
)
endlocal
