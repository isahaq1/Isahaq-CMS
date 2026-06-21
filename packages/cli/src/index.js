import { intro, outro, cancel, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { runCreate } from './commands/create.js';

const args = process.argv.slice(2);
const command = args[0];

// Support: npx create-group-cms           → runs create
//          npx create-group-cms setup      → just writes .env (existing install)
//          npx create-group-cms migrate    → just runs migrations

async function main() {
  console.log('');
  intro(pc.bgCyan(pc.black(' create-group-cms ')));

  if (!command || command === 'create') {
    await runCreate(args[0] && !['setup', 'migrate'].includes(args[0]) ? args[0] : undefined);
  } else if (command === 'setup') {
    const { runSetup } = await import('./commands/setup.js');
    await runSetup(process.cwd());
  } else if (command === 'migrate') {
    const { runMigrate } = await import('./commands/migrate.js');
    await runMigrate(process.cwd());
  } else {
    console.error(pc.red(`Unknown command: ${command}`));
    console.log('Usage:');
    console.log('  npx create-group-cms [project-name]');
    console.log('  npx create-group-cms setup');
    console.log('  npx create-group-cms migrate');
    process.exit(1);
  }
}

main().catch((err) => {
  if (isCancel(err)) {
    cancel('Setup cancelled.');
    process.exit(0);
  }
  console.error(pc.red('\nUnexpected error:'), err.message);
  process.exit(1);
});
