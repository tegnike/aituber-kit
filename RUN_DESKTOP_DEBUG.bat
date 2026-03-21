@echo off
setlocal
set "APP_EXE=%~dp0dist-electron-portable\win-unpacked\AITuberKit.exe"
set "LOG_FILE=%APPDATA%\aituber-kit\startup.log"

echo ----------------------------------------
echo AITuberKit Desktop Debug Launcher
echo ----------------------------------------
echo EXE: %APP_EXE%
echo LOG: %LOG_FILE%
echo.

if not exist "%APP_EXE%" (
  echo [ERROR] EXE not found.
  pause
  exit /b 1
)

set "ELECTRON_ENABLE_LOGGING=1"
set "ELECTRON_ENABLE_STACK_DUMPING=1"

if exist "%LOG_FILE%" del /f /q "%LOG_FILE%" >nul 2>&1
start "" "%APP_EXE%"

timeout /t 5 >nul
echo Recent startup log:
if exist "%LOG_FILE%" (
  powershell -NoProfile -Command "Get-Content -Path '%LOG_FILE%' -Tail 30"
) else (
  echo (no startup.log yet)
)

echo.
echo If the app window does not appear, share this log file:
echo %LOG_FILE%
echo.
pause
