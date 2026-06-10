#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

$NODE_EXE = "node"
if ($env:NODE_PATH) {
  $NODE_EXE = "$env:NODE_PATH\node.exe"
}

& $NODE_EXE "$PSScriptRoot\husky.js" $args
