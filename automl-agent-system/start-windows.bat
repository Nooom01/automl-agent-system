@echo off
echo Starting AutoML Agent System...
echo.
echo If you see connection refused errors in WSL2, try this instead:
echo.

REM Kill any existing node processes on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul

REM Start the development server
npm run dev

pause