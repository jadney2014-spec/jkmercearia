@echo off
title JK Mercearia - Setup
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
if errorlevel 1 (
    echo.
    echo Setup falhou. Verifique as mensagens acima.
    pause
    exit /b 1
)
echo.
pause
