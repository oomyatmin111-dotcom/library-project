@echo off
title My Easy Job - Management Suite
echo ========================================================
echo        My Easy Job - Executive Management Suite
echo   Meeting Minutes Transcriber, Reports and Date Warnings
echo ========================================================
echo.
cd /d "%~dp0"
echo Starting FastAPI Web Server at http://127.0.0.1:8000 ...
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
pause
