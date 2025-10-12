@echo off
echo ========================================
echo KMIT Clubs Hub - Starting Application
echo ========================================
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Checking Redis status...
    docker ps | findstr kmit-redis >nul 2>&1
    if %errorlevel% neq 0 (
        echo Starting Redis with Docker...
        docker-compose up -d redis
        timeout /t 3 /nobreak >nul
    ) else (
        echo Redis is already running
    )
) else (
    echo WARNING: Docker not found. Make sure Redis is running manually.
    echo See REDIS_SETUP.md for Redis installation options.
    echo.
)

echo Starting Backend Server...
start cmd /k "cd Backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start cmd /k "cd Frontend && npm run dev"

echo.
echo ========================================
echo All services are starting...
echo Redis: localhost:6379
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
