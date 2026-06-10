@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-push-deploy.ps1"
pause
