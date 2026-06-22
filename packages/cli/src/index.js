import { cancel, isCancel } from '@clack/prompts';
import gradient from 'gradient-string';
import pc from 'picocolors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

// ── Brand ────────────────────────────────────────────────────────────────────

const brand = gradient.cristal('create-group-cms');
const dim   = (s) => pc.dim(s);

function showBanner() {
  console.log('');
  console.log(`  ${brand}  ${dim(`v${pkg.version}`)}`);
  console.log(`  ${dim('Full-stack Multi-Site CMS — Next.js · Express · Prisma')}`);
  console.log('');
}

function showHelp() {
  console.log(`
  ${brand}  ${dim(`v${pkg.version}`)}

  ${pc.bold('Usage')}

    npx create-group-cms ${pc.cyan('[project-name]')}   Scaffold a new CMS project
    npx create-group-cms ${pc.cyan('setup')}             Configure database credentials
    npx create-group-cms ${pc.cyan('migrate')}           Run Prisma migrations / db push

  ${pc.bold('Flags')}

    ${pc.cyan('--help,    -h')}   Show this help message
    ${pc.cyan('--version, -v')}   Print version number

  ${pc.bold('Examples')}

    ${dim('$')} npx create-group-cms my-cms
    ${dim('$')} npx create-group-cms setup
    ${dim('$')} npx create-group-cms migrate

  ${pc.bold('Stack')}

    Frontend   Next.js 15 (App Router) + Tailwind CSS
    Backend    Express + TypeScript
    Database   PostgreSQL 14+ or MySQL 8+
    ORM        Prisma
    Auth       JWT

  ${dim('  Docs  https://github.com/isahaq1/Isahaq-CMS')}
  ${dim('  Bugs  https://github.com/isahaq1/Isahaq-CMS/issues')}
`);
}

// ── Routing ──────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const command = args[0];
const RESERVED = ['setup', 'migrate', 'create', '--help', '-h', '--version', '-v'];

if (args.includes('--version') || args.includes('-v')) {
  console.log(pkg.version);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

showBanner();

async function main() {
  const COMMANDS = ['setup', 'migrate', 'create'];

  if (!command || !COMMANDS.includes(command)) {
    const { runCreate } = await import('./commands/create.js');
    await runCreate(command || undefined);
  } else if (command === 'create') {
    const { runCreate } = await import('./commands/create.js');
    await runCreate(args[1] || undefined);
  } else if (command === 'setup') {
    const { runSetup } = await import('./commands/setup.js');
    await runSetup(process.cwd());
  } else if (command === 'migrate') {
    const { runMigrate } = await import('./commands/migrate.js');
    await runMigrate(process.cwd());
  }
}

main().catch((err) => {
  if (isCancel(err)) {
    cancel('Cancelled.');
    process.exit(0);
  }
  console.error(pc.red('\n  Error:'), err.message);
  process.exit(1);
});
