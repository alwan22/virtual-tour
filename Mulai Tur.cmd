@echo off
setlocal
cd /d "%~dp0"
title Atlas Arcadia - Tur Virtual
echo Buka http://127.0.0.1:8765/index.htm di browser.
echo Biarkan jendela ini terbuka selama tur digunakan.
python -m http.server 8765 --bind 127.0.0.1
if errorlevel 1 pause
