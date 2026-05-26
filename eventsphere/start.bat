@echo off
title EventSphere Platform Launcher
color 0b

echo ==========================================================
echo           E V E N T S P H E R E   L A U N C H E R
echo ==========================================================
echo.

:: 1. Verify Node.js presence on system
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js runtime environment was not found on your system!
    echo.
    echo Opening nodejs.org download page in your default browser...
    start "" "https://nodejs.org/"
    echo.
    echo Please install the LTS version of Node.js and restart this launcher script.
    echo ==========================================================
    pause
    exit
)

echo [1/5] Node.js environment detected successfully.

:: 2. Auto-Start MongoDB if Stopped
echo [2/5] Auditing local MongoDB Database status...
netstat -o -a -n | findstr :27017 >nul
if %errorlevel% equ 0 (
    echo Database service is already active on Port 27017.
) else (
    echo Database service is stopped. Starting silent MongoDB database daemon...
    
    :: Create workspace database data folder if not exists
    if not exist db_data (
        mkdir db_data
    )
    
    :: Launch mongod.exe programmatically in a hidden background window
    powershell -Command "Start-Process -FilePath 'C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe' -ArgumentList '--dbpath db_data' -WindowStyle Hidden"
    
    :: Give the database engine 3 seconds to fully initialize and bind to Port 27017
    echo Waiting for database to initialize...
    timeout /t 3 >nul
)
echo.

:: 3. Install and boot server dependencies
echo [3/5] Initializing EventSphere Express API Server...
cd server
if not exist node_modules (
    echo Installing backend dependencies (this may take a moment)...
    call npm install
)

echo Seeding database with initial data catalog...
call npm run seed

echo Launching API server in separate window...
start "EventSphere API Server" cmd /k "npm run dev"

cd ..
echo.

:: 4. Install and boot client dependencies
echo [4/5] Initializing EventSphere React Client...
cd client
if not exist node_modules (
    echo Installing client dependencies (this may take a moment)...
    call npm install
)

echo.
echo [5/5] Starting React Dev Server...
echo ==========================================================
echo Dynamic open enabled: The browser will open EventSphere shortly!
echo ==========================================================
echo.
call npm run dev
