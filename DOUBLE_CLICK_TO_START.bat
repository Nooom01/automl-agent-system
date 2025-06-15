@echo off
title AutoML-Agent System - Starting...
color 0A

echo.
echo ==========================================
echo   AutoML-Agent System - Starting...
echo ==========================================
echo.

REM Force change to the directory where this bat file is located
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Check if we're in the right place
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Make sure this bat file is in the project folder
    echo Current location: %CD%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo Found package.json - we're in the right place!
echo.

REM Check if npm exists
echo Testing npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm command not found!
    echo Node.js might not be installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo npm version: %NPM_VERSION%
echo.

echo Starting dependency installation and server...
echo This window will stay open to show progress.
echo.

echo [Step 1/4] Cleaning npm cache...
call npm cache clean --force
if %errorlevel% neq 0 (
    echo Cache clean failed, but continuing...
)
echo Cache cleaned.
echo.

echo [Step 2/4] Removing old node_modules...
if exist "node_modules" (
    echo Deleting node_modules folder...
    rmdir /s /q "node_modules" 2>nul
    echo Old dependencies removed.
) else (
    echo No existing node_modules found.
)
echo.

echo [Step 3/4] Installing dependencies...
echo This may take 1-2 minutes, please wait...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed!
    echo Check your internet connection and try again.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo [Step 4/4] Starting development server...
echo.
echo ==========================================
echo   Server starting... 
echo ==========================================
echo.
echo The app will be available at:
echo   http://localhost:5173/
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul

REM Try to open browser
start "" "http://localhost:5173/"

echo.
echo Server is starting... Press Ctrl+C to stop
echo.

REM Start the server and keep window open
call npm run dev

echo.
echo ==========================================
echo Server stopped.
echo Press any key to close this window...
pause >nul