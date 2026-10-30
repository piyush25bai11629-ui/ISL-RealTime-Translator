@echo off
title ISL Real-Time Translator - Web Portal
echo ========================================================
echo   ISL Real-Time Translator - 1-Click Web Portal
echo   Running In-Browser AI Engine (Zero Terminal Needed)
echo ========================================================
echo.
echo Starting local web server on port 3000...
start "" http://localhost:3000
python -m http.server 3000
pause
