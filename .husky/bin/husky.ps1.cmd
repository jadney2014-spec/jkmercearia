@echo off
setlocal

set "NODE_EXE=node"
if not "%NODE_PATH%"=="" (
  set "NODE_EXE=%NODE_PATH%\node.exe"
)

"%NODE_EXE%" "%~dp0\husky.js" %*