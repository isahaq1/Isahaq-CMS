#!/usr/bin/env node
'use strict';

// Require Node 20+
const [major] = process.versions.node.split('.').map(Number);
if (major < 20) {
  console.error('\x1b[31mError:\x1b[0m create-group-cms requires Node.js 20 or higher.');
  console.error(`You are running Node.js ${process.versions.node}.`);
  process.exit(1);
}

import('../src/index.js').catch((err) => {
  console.error(err);
  process.exit(1);
});
