@echo off
title My Easy Job - Stop Background Service
echo Stopping My Easy Job background processes...
taskkill /f /im uvicorn.exe >nul 2>&1
taskkill /f /im cloudflared.exe >nul 2>&1
echo Done! All background services have been stopped.
pause
