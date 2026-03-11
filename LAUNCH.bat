@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ============================================
echo   AITuberKit - Starting...
echo ============================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo.
)

echo Starting development server...
echo Press Ctrl+C to stop the server.
echo.

rem Open browser automatically after server starts
start /b cmd /c "timeout /t 3 >nul && start http://localhost:3000"

npm run dev

pause
