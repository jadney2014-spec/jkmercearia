@echo off
setlocal
cd /d "%~dp0"
echo Instalando dependencia xlsx...
call npm install xlsx
if errorlevel 1 goto manual
echo Executando parser...
node parse-excel.js
if errorlevel 1 goto manual
echo Concluido: parsed-products.json
exit /b 0

:manual
echo Tentando parser manual (sem npm)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-parse.ps1"
exit /b %ERRORLEVEL%
