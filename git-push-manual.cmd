@echo off

title JK Mercearia - Git Push Manual

cd /d "%~dp0"

if not exist package.json (

    echo ERRO: Projeto nao encontrado.

    pause

    exit /b 1

)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0git-push-manual.ps1"

echo.

pause

