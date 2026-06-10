@echo off

title JK Mercearia - Configurar Git

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-git.ps1"

echo.

pause

