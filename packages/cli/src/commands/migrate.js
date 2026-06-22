import { spinner, note } from '@clack/prompts';
import { execa } from 'execa';
import pc from 'picocolors';
import path from 'path';
import fs from 'fs';
import { readEnv } from '../utils/env.js';
import { ensureDatabase, parseDbUrl } from '../utils/db.js';

const TOTAL_STEPS = 4;

function step(n, label) {
  return `${pc.dim(`[${n}/${TOTAL_STEPS}]`)} ${label}`;
}

function elapsed(start) {
  return pc.dim(`${((Date.now() - start) / 1000).toFixed(1)}s`);
}

export async function runMigrate(projectDir) {
  const env = readEnv(projectDir);
  if (!env.DATABASE_URL) {
    console.error(pc.red('  DATABASE_URL not found in .env — run setup first.'));
    process.exit(1);
  }

  const apiDir = findApiDir(projectDir);
  if (!apiDir) {
    console.error(pc.red('  Could not find apps/api directory with a Prisma schema.'));
    process.exit(1);
  }

  const schemaPath = path.join(apiDir, 'prisma', 'schema.prisma');
  const dbType = env.DB_TYPE || 'postgresql';
  const provider = dbType === 'mysql' ? 'mysql' : 'postgresql';
  const dbLabel = provider === 'mysql'
    ? pc.yellow('MySQL')
    : pc.blue('PostgreSQL');

  patchSchemaProvider(schemaPath, provider);

  if (provider === 'mysql') {
    clearMigrations(apiDir);
  } else {
    patchMigrationLock(apiDir, provider);
  }

  const prismaBin = path.join(projectDir, 'node_modules', '.bin', 'prisma');
  if (!fs.existsSync(prismaBin)) {
    console.error(pc.red('  Prisma binary not found — install dependencies first.'));
    process.exit(1);
  }

  const execEnv = { ...process.env, DATABASE_URL: env.DATABASE_URL };
  const s = spinner();

  // ── [1/4] Ensure database exists ─────────────────────────────────────────────
  let t = Date.now();
  const parsed = parseDbUrl(env.DATABASE_URL);
  if (parsed) {
    s.start(step(1, 'Ensuring database exists…'));
    const dbResult = await ensureDatabase({ dbType, ...parsed });
    if (dbResult.ok) {
      const msg = dbResult.created
        ? `✓ Database ${pc.cyan(parsed.database)} created`
        : `✓ Database ${pc.cyan(parsed.database)} already exists`;
      s.stop(pc.green(msg) + ` ${elapsed(t)}`);
    } else {
      s.stop(pc.yellow(`⚠ Could not ensure database: ${dbResult.error} — proceeding anyway`));
    }
  } else {
    console.log(`  ${pc.dim(`[1/${TOTAL_STEPS}]`)} ${pc.dim('Skipping DB check (could not parse DATABASE_URL)')}`);
  }

  // ── [2/4] Generate Prisma client ─────────────────────────────────────────────
  t = Date.now();
  s.start(step(2, 'Generating Prisma client…'));
  try {
    await execa(prismaBin, ['generate', '--schema', schemaPath], {
      cwd: projectDir,
      env: execEnv,
    });
    s.stop(pc.green('✓ Prisma client generated') + ` ${elapsed(t)}`);
  } catch (err) {
    s.stop(pc.red('✗ prisma generate failed'));
    console.error(pc.dim(err.stderr || err.message));
    process.exit(1);
  }

  // ── [3/4] Apply schema ───────────────────────────────────────────────────────
  t = Date.now();
  if (provider === 'mysql') {
    s.start(step(3, `Pushing schema to ${dbLabel} database…`));
    try {
      await execa(
        prismaBin,
        ['db', 'push', '--schema', schemaPath, '--accept-data-loss'],
        { cwd: projectDir, env: execEnv },
      );
      s.stop(pc.green('✓ Schema pushed to MySQL') + ` ${elapsed(t)}`);
    } catch (err) {
      s.stop(pc.red('✗ db push failed'));
      console.error(pc.dim(err.stderr || err.message));
      process.exit(1);
    }
  } else {
    s.start(step(3, `Running migrations on ${dbLabel} database…`));
    try {
      await execa(
        prismaBin,
        ['migrate', 'deploy', '--schema', schemaPath],
        { cwd: projectDir, env: execEnv },
      );
      s.stop(pc.green('✓ Migrations applied') + ` ${elapsed(t)}`);
    } catch (err) {
      s.stop(pc.red('✗ Migration failed'));
      console.error(pc.dim(err.stderr || err.message));
      process.exit(1);
    }
  }

  // ── [4/4] Seed ────────────────────────────────────────────────────────────────
  const seedFile = path.join(apiDir, 'prisma', 'seed.ts');
  if (fs.existsSync(seedFile)) {
    t = Date.now();
    const tsxBin = path.join(projectDir, 'node_modules', '.bin', 'tsx');
    s.start(step(4, 'Running seed…'));
    try {
      await execa(tsxBin, [seedFile], { cwd: projectDir, env: execEnv });
      s.stop(pc.green('✓ Database seeded') + ` ${elapsed(t)}`);
    } catch {
      s.stop(pc.yellow('⚠ Seed skipped (already seeded or failed — safe to ignore)'));
    }
  } else {
    console.log(`  ${pc.dim(`[${TOTAL_STEPS}/${TOTAL_STEPS}]`)} ${pc.dim('No seed file found — skipping')}`);
  }

  note(
    [
      `  ${pc.bold('Database')}   ${dbLabel} — schema applied`,
      `  ${pc.bold('Start dev')}  ${pc.cyan('npm run dev')}`,
    ].join('\n'),
    pc.green('✓ Database ready')
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  if (patched !== content) fs.writeFileSync(schemaPath, patched, 'utf8');
}

function patchMigrationLock(apiDir, provider) {
  const lockPath = path.join(apiDir, 'prisma', 'migrations', 'migration_lock.toml');
  if (!fs.existsSync(lockPath)) return;
  const content = fs.readFileSync(lockPath, 'utf8');
  const patched = content.replace(/provider\s*=\s*"[^"]+"/, `provider = "${provider}"`);
  if (patched !== content) fs.writeFileSync(lockPath, patched, 'utf8');
}

function clearMigrations(apiDir) {
  const migrationsDir = path.join(apiDir, 'prisma', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    fs.rmSync(migrationsDir, { recursive: true, force: true });
  }
}
