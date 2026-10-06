@echo off
title My Easy Job - Public Tunnel Publisher
echo ========================================================
echo        My Easy Job - Cloudflare Public Tunnel
echo ========================================================
echo.
cd /d "%~dp0"
echo Starting Cloudflare Tunnel for http://127.0.0.1:8000 ...
..\cloudflared.exe tunnel --url http://127.0.0.1:8000
pause
