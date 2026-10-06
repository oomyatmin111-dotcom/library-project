@echo off
title My Easy Job - Windows Auto-Start Setup
echo ========================================================
echo        My Easy Job - Windows Auto-Start Setup
echo ========================================================
echo.
set "TARGET=%~dp0start_background.vbs"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_FOLDER%\MyEasyJob_AutoStart.vbs"

echo Copying silent background starter to Windows Startup folder...
copy /y "%TARGET%" "%SHORTCUT%"

echo.
echo [SUCCESS] My Easy Job is now set to run automatically on Windows startup!
echo It will run quietly in the background without opening any command window.
echo.
pause
