#!/usr/bin/env node
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const isGitHooksDir = existsSync('.git/hooks');

if (!isGitHooksDir) {
  console.log('husky - .git/hooks not found, skipping Git hooks uninstallation');
  process.exit(0);
}

const hookFiles = ['pre-commit', 'commit-msg'];

for (const hook of hookFiles) {
  const hookPath = join('.git/hooks', hook);
  
  if (existsSync(hookPath)) {
    unlinkSync(hookPath);
    console.log(`husky - removed ${hook}`);
  }
}
