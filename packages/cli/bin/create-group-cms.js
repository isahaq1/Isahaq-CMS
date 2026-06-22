#!/usr/bin/env node
'use strict';

// Node 20+ required
const [major] = process.versions.node.split('.').map(Number);
if (major < 20) {
  console.error('\x1b[31m\n  Error:\x1b[0m create-group-cms requires Node.js 20 or higher.');
  console.error(`  You are running Node.js \x1b[33m${process.versions.node}\x1b[0m`);
  console.error('  Download the latest at \x1b[36mhttps://nodejs.org\x1b[0m\n');
  process.exit(1);
}

import('../src/index.js').catch((err) => {
  console.error('\x1b[31mFatal error:\x1b[0m', err.message);
  process.exit(1);
});
