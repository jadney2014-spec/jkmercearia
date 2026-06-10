@echo off
title JK Mercearia - Automacao Completa
cd /d "%~dp0"

if "%~1"=="" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0automate-all.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0automate-all.ps1" -ServiceAccountPath "%~1"
)

if errorlevel 1 (
    echo.
    echo Automacao falhou. Verifique as mensagens acima.
    pause
    exit /b 1
)
echo.
pause
