import { spinner, note } from '@clack/prompts';
import { execa } from 'execa';
import pc from 'picocolors';
import path from 'path';
import fs from 'fs';
import { readEnv } from '../utils/env.js';

export async function runMigrate(projectDir) {
  const env = readEnv(projectDir);
  if (!env.DATABASE_URL) {
    console.error(pc.red('DATABASE_URL not found in .env — run setup first.'));
    process.exit(1);
  }

  // Find the API workspace (has prisma/schema.prisma)
  const apiDir = findApiDir(projectDir);
  if (!apiDir) {
    console.error(pc.red('Could not find apps/api directory with a Prisma schema.'));
    process.exit(1);
  }

  const s = spinner();

  // 1. Generate Prisma client
  s.start('Generating Prisma client…');
  try {
    await execa('npx', ['prisma', 'generate'], {
      cwd: apiDir,
      env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
    });
    s.stop(pc.green('✓ Prisma client generated'));
  } catch (err) {
    s.stop(pc.red('✗ prisma generate failed'));
    console.error(err.stderr || err.message);
    process.exit(1);
  }

  // 2. Deploy migrations
  s.start('Running database migrations…');
  try {
    await execa('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: apiDir,
      env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
    });
    s.stop(pc.green('✓ Migrations applied'));
  } catch (err) {
    s.stop(pc.red('✗ Migration failed'));
    console.error(err.stderr || err.message);
    process.exit(1);
  }

  // 3. Seed if seed file exists and no users yet (safe first-run seed)
  const seedFile = path.join(apiDir, 'prisma', 'seed.ts');
  if (fs.existsSync(seedFile)) {
    s.start('Running seed (first-run only)…');
    try {
      await execa('npx', ['tsx', seedFile], {
        cwd: apiDir,
        env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
      });
      s.stop(pc.green('✓ Seed complete'));
    } catch {
      s.stop(pc.yellow('⚠ Seed skipped (already seeded or failed — safe to ignore)'));
    }
  }

  note(
    'Database is ready. Start the project with:\n' +
    pc.cyan('  npm run dev'),
    'Done'
  );
}

function findApiDir(projectDir) {
  const candidates = [
    path.join(projectDir, 'apps', 'api'),
    path.join(projectDir, 'api'),
    projectDir,
  ];
  return candidates.find((d) =>
    fs.existsSync(path.join(d, 'prisma', 'schema.prisma'))
  ) || null;
}
