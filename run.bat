@echo off
title CORVUS - THE WATCHING CROW - Startup
echo ========================================================
echo    CORVUS -- THE WATCHING CROW : SYSTEM STARTUP
echo ========================================================
echo.
echo [1/3] Starting Backend API Server (FastAPI + Uvicorn)...
cd /d "%~dp0backend"
start "CORVUS Backend (Port 8000)" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Waiting 3 seconds for Backend to initialize...
ping -n 4 127.0.0.1 >nul 2>&1

echo [3/3] Starting Frontend Dev Server (Next.js)...
cd /d "%~dp0frontend"
start "CORVUS Frontend (Port 3000)" cmd /k "npm run dev"

echo.
echo All services launched!
echo - Backend API:  http://localhost:8000 (Swagger: http://localhost:8000/docs)
echo - Frontend UI:  http://localhost:3000
echo - Workspace:    http://localhost:3000/workspace/proj_0001
echo.
echo Opening browser in 5 seconds...
ping -n 6 127.0.0.1 >nul 2>&1
start http://localhost:3000/workspace/proj_0001
echo Done!
