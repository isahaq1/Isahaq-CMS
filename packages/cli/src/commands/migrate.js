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

  const apiDir = findApiDir(projectDir);
  if (!apiDir) {
    console.error(pc.red('Could not find apps/api directory with a Prisma schema.'));
    process.exit(1);
  }

  const schemaPath = path.join(apiDir, 'prisma', 'schema.prisma');
  const dbType = env.DB_TYPE || 'postgresql';
  const provider = dbType === 'mysql' ? 'mysql' : 'postgresql';

  // Patch schema.prisma provider
  patchSchemaProvider(schemaPath, provider);

  if (provider === 'mysql') {
    // MySQL: remove PostgreSQL-generated migration files — they contain PG-specific SQL
    // (CREATE TYPE for enums, etc.) that MySQL cannot execute.
    // prisma db push creates the schema directly from models — no migration history needed.
    clearMigrations(apiDir);
  } else {
    // PostgreSQL: keep existing migrations, just sync the lock file provider
    patchMigrationLock(apiDir, provider);
  }

  // Use the project's own prisma binary (avoids npx path resolution issues in monorepos)
  const prismaBin = path.join(projectDir, 'node_modules', '.bin', 'prisma');
  if (!fs.existsSync(prismaBin)) {
    console.error(pc.red('Prisma binary not found — make sure dependencies are installed first.'));
    process.exit(1);
  }

  const execEnv = { ...process.env, DATABASE_URL: env.DATABASE_URL };
  const s = spinner();

  // 1. Generate Prisma client
  s.start('Generating Prisma client…');
  try {
    await execa(prismaBin, ['generate', '--schema', schemaPath], {
      cwd: projectDir,
      env: execEnv,
    });
    s.stop(pc.green('✓ Prisma client generated'));
  } catch (err) {
    s.stop(pc.red('✗ prisma generate failed'));
    console.error(err.stderr || err.message);
    process.exit(1);
  }

  // 2. Apply schema to database
  if (provider === 'mysql') {
    // db push: applies schema directly from Prisma models — works cleanly on a fresh MySQL DB
    s.start('Pushing schema to MySQL database…');
    try {
      await execa(
        prismaBin,
        ['db', 'push', '--schema', schemaPath, '--accept-data-loss'],
        { cwd: projectDir, env: execEnv },
      );
      s.stop(pc.green('✓ Schema pushed to MySQL'));
    } catch (err) {
      s.stop(pc.red('✗ db push failed'));
      console.error(err.stderr || err.message);
      process.exit(1);
    }
  } else {
    // migrate deploy: applies existing PostgreSQL migration files in order
    s.start('Running database migrations…');
    try {
      await execa(
        prismaBin,
        ['migrate', 'deploy', '--schema', schemaPath],
        { cwd: projectDir, env: execEnv },
      );
      s.stop(pc.green('✓ Migrations applied'));
    } catch (err) {
      s.stop(pc.red('✗ Migration failed'));
      console.error(err.stderr || err.message);
      process.exit(1);
    }
  }

  // 3. Seed if seed file exists
  const seedFile = path.join(apiDir, 'prisma', 'seed.ts');
  if (fs.existsSync(seedFile)) {
    const tsxBin = path.join(projectDir, 'node_modules', '.bin', 'tsx');
    s.start('Running seed (first-run only)…');
    try {
      await execa(tsxBin, [seedFile], {
        cwd: projectDir,
        env: execEnv,
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

function patchSchemaProvider(schemaPath, provider) {
  if (!fs.existsSync(schemaPath)) return;
  const content = fs.readFileSync(schemaPath, 'utf8');
  const patched = content.replace(
    /(datasource\s+\w+\s*\{[^}]*provider\s*=\s*")[^"]+(")/s,
    `$1${provider}$2`
  );
  if (patched !== content) {
    fs.writeFileSync(schemaPath, patched, 'utf8');
  }
}

function patchMigrationLock(apiDir, provider) {
  const lockPath = path.join(apiDir, 'prisma', 'migrations', 'migration_lock.toml');
  if (!fs.existsSync(lockPath)) return;
  const content = fs.readFileSync(lockPath, 'utf8');
  const patched = content.replace(/provider\s*=\s*"[^"]+"/, `provider = "${provider}"`);
  if (patched !== content) {
    fs.writeFileSync(lockPath, patched, 'utf8');
  }
}

// Remove PostgreSQL-generated migration files — MySQL uses db push instead
function clearMigrations(apiDir) {
  const migrationsDir = path.join(apiDir, 'prisma', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    fs.rmSync(migrationsDir, { recursive: true, force: true });
  }
}
