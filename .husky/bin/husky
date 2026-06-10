#!/usr/bin/env node
const { execSync } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const isWin = process.platform === 'win32';
const isGitHooksDir = existsSync('.git/hooks');

if (!isGitHooksDir) {
  console.log('husky - .git/hooks not found, skipping Git hooks installation');
  process.exit(0);
}

const huskyDir = join(__dirname, '..', '_');
const huskySh = join(huskyDir, 'husky.sh');

if (!existsSync(huskySh)) {
  console.log('husky - husky.sh not found, skipping Git hooks installation');
  process.exit(0);
}

const hookFiles = ['pre-commit', 'commit-msg'];

for (const hook of hookFiles) {
  const hookPath = join('.git/hooks', hook);
  const huskyHookPath = join(__dirname, '..', hook);

  if (existsSync(huskyHookPath)) {
    const hookContent = readFileSync(huskyHookPath, 'utf8');
    const shebang = isWin ? '#!/bin/sh' : '#!/usr/bin/env sh';
    const content = `${shebang}\n. "$(dirname -- "$0")/_/husky.sh"\n\n${hookContent}`;
    
    writeFileSync(hookPath, content);
    execSync(`chmod +x ${hookPath}`);
    console.log(`husky - created ${hook}`);
  }
}
