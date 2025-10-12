@echo off
echo ========================================
echo KMIT Clubs Hub - Starting All Services
echo ========================================
echo.

echo [1/4] Checking MongoDB...
net start MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo MongoDB service started successfully
) else (
    echo MongoDB service already running or not installed
    echo If not running, start manually: mongod
)
echo.

echo [2/4] Starting Redis...
start "Redis Server" cmd /k "cd /d C:\Program Files\Redis && redis-server redis.windows.conf"
timeout /t 2 /nobreak >nul
echo Redis started in separate window
echo.

echo [3/4] Starting Backend Server...
start "Backend Server" cmd /k "cd /d c:\Users\ACER\Desktop\Backend && npm run dev"
timeout /t 3 /nobreak >nul
echo Backend starting on http://localhost:5000
echo.

echo [4/4] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d c:\Users\ACER\Desktop\kmit-clubs-hub\Frontend && npm run dev"
timeout /t 2 /nobreak >nul
echo Frontend starting on http://localhost:3000
echo.

echo ========================================
echo All services are starting!
echo ========================================
echo.
echo Check each window for status:
echo   - Redis Server (separate window)
echo   - Backend Server (separate window)
echo   - Frontend Server (separate window)
echo.
echo Once all services are running:
echo   - Backend: http://localhost:5000
echo   - Frontend: http://localhost:3000
echo.
echo If you see errors, check:
echo   1. MongoDB is running (mongosh to test)
echo   2. Redis window shows no errors
echo   3. Backend .env is configured
echo   4. All npm dependencies installed
echo.
echo ========================================
pause
