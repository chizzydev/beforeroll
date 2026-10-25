@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Verify-M3S31.ps1"
if errorlevel 1 (
  echo.
  echo BEFORE-ROLL WINDOWS AUTOMATED GATE: FAILED. Review the lines above.
) else (
  echo.
  echo M3S31_WINDOWS_OWNER_AUTOMATED_GATE=PASS
)
echo.
echo Keep all API keys local in .env, never in the browser.
pause
endlocal
