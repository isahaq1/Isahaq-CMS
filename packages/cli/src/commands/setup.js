import {
  text, password, confirm, select, spinner, note, isCancel, cancel,
} from '@clack/prompts';
import pc from 'picocolors';
import { ensureDatabase, buildUrl } from '../utils/db.js';
import { readEnv, writeEnv } from '../utils/env.js';

export async function runSetup(projectDir) {
  const existing = readEnv(projectDir);

  // Show existing-config notice
  if (existing.DATABASE_URL) {
    note(
      pc.yellow('An existing .env was found — answering will overwrite it.'),
      'Update Database Config'
    );
  }

  // ── Database type ────────────────────────────────────────────────────────────
  const dbType = await select({
    message: 'Database type',
    options: [
      {
        value: 'postgresql',
        label: `${pc.blue('●')} PostgreSQL  ${pc.dim('(recommended)')}`,
        hint: 'port 5432',
      },
      {
        value: 'mysql',
        label: `${pc.yellow('●')} MySQL`,
        hint: 'port 3306',
      },
    ],
    initialValue: existing.DB_TYPE || 'postgresql',
  });
  if (isCancel(dbType)) return cancel('Setup cancelled.');

  const isMySQL = dbType === 'mysql';
  const defaultPort = isMySQL ? '3306' : '5432';
  const defaultUser = isMySQL ? 'root' : 'postgres';
  const dbLabel    = isMySQL ? pc.yellow('MySQL') : pc.blue('PostgreSQL');

  console.log(`\n  ${pc.bold('Configuring')} ${dbLabel} connection\n`);

  // ── Host ─────────────────────────────────────────────────────────────────────
  const host = await text({
    message: 'Host',
    placeholder: 'localhost',
    defaultValue: existing.DB_HOST || 'localhost',
  });
  if (isCancel(host)) return cancel('Setup cancelled.');

  // ── Port ─────────────────────────────────────────────────────────────────────
  const port = await text({
    message: 'Port',
    placeholder: defaultPort,
    defaultValue: existing.DB_PORT || defaultPort,
    validate: (v) => (isNaN(Number(v)) ? 'Must be a number' : undefined),
  });
  if (isCancel(port)) return cancel('Setup cancelled.');

  // ── Database name ────────────────────────────────────────────────────────────
  const database = await text({
    message: 'Database name',
    placeholder: 'group_cms',
    defaultValue: existing.DB_NAME || 'group_cms',
    validate: (v) => (!v.trim() ? 'Required' : undefined),
  });
  if (isCancel(database)) return cancel('Setup cancelled.');

  // ── User ─────────────────────────────────────────────────────────────────────
  const user = await text({
    message: 'User',
    placeholder: defaultUser,
    defaultValue: existing.DB_USER || defaultUser,
    validate: (v) => (!v.trim() ? 'Required' : undefined),
  });
  if (isCancel(user)) return cancel('Setup cancelled.');

  // ── Password ─────────────────────────────────────────────────────────────────
  const pwd = await password({
    message: 'Password',
    validate: (v) => (v === undefined ? 'Required' : undefined),
  });
  if (isCancel(pwd)) return cancel('Setup cancelled.');

  // ── JWT secret ───────────────────────────────────────────────────────────────
  const jwtSecret = await text({
    message: 'JWT secret  (blank = auto-generate)',
    placeholder: '<auto-generate>',
    defaultValue: existing.JWT_SECRET || '',
  });
  if (isCancel(jwtSecret)) return cancel('Setup cancelled.');

  // ── Build URL ────────────────────────────────────────────────────────────────
  const url = buildUrl({
    dbType,
    host: host || 'localhost',
    port: port || defaultPort,
    database: database || 'group_cms',
    user: user || defaultUser,
    password: pwd,
  });

  // ── Test connection ──────────────────────────────────────────────────────────
  const shouldTest = await confirm({
    message: 'Test database connection before saving?',
    initialValue: true,
  });
  if (isCancel(shouldTest)) return cancel('Setup cancelled.');

  if (shouldTest) {
    const s = spinner();
    const dbName = database || 'group_cms';
    s.start(`Connecting to ${dbLabel} and checking database…`);
    const result = await ensureDatabase({
      dbType,
      host: host || 'localhost',
      port: port || defaultPort,
      database: dbName,
      user: user || defaultUser,
      password: pwd,
    });
    if (result.ok) {
      const msg = result.created
        ? `✓ Database ${pc.cyan(dbName)} created successfully`
        : `✓ Connected — database ${pc.cyan(dbName)} already exists`;
      s.stop(pc.green(msg));
    } else {
      s.stop(pc.red('✗ Connection failed: ' + result.error));
      const force = await confirm({
        message: 'Save credentials anyway? (you can fix them later)',
        initialValue: false,
      });
      if (isCancel(force) || !force) return cancel('Setup cancelled.');
    }
  }

  // ── Write .env ───────────────────────────────────────────────────────────────
  const secret = jwtSecret || generateSecret();
  const resolvedHost = host || 'localhost';
  const resolvedPort = port || defaultPort;
  const resolvedName = database || 'group_cms';
  const resolvedUser = user || defaultUser;

  const vars = {
    DATABASE_URL: url,
    DB_TYPE: dbType,
    DB_HOST: resolvedHost,
    DB_PORT: resolvedPort,
    DB_NAME: resolvedName,
    DB_USER: resolvedUser,
    JWT_SECRET: secret,
    JWT_EXPIRES_IN: existing.JWT_EXPIRES_IN || '7d',
    API_PORT: existing.API_PORT || '4000',
    CORS_ORIGIN: existing.CORS_ORIGIN || 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: existing.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    UPLOAD_DIR: existing.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: existing.MAX_FILE_SIZE || '10485760',
  };

  const envPath = writeEnv(projectDir, vars);

  note(
    [
      `  ${pc.dim('File')}      ${pc.dim(envPath)}`,
      `  ${pc.dim('Type')}      ${dbLabel}`,
      `  ${pc.dim('Host')}      ${resolvedHost}:${resolvedPort}`,
      `  ${pc.dim('Database')} ${resolvedName}`,
      `  ${pc.dim('User')}      ${resolvedUser}`,
    ].join('\n'),
    pc.green('✓ .env written')
  );

  return vars;
}

function generateSecret(len = 48) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
