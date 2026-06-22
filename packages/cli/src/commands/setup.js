import {
  text, password, confirm, select, spinner, note, isCancel, cancel,
} from '@clack/prompts';
import pc from 'picocolors';
import { testConnection, buildUrl } from '../utils/db.js';
import { readEnv, writeEnv } from '../utils/env.js';

export async function runSetup(projectDir) {
  const existing = readEnv(projectDir);

  note(
    existing.DATABASE_URL
      ? pc.yellow('DATABASE_URL already exists — values below will update it.')
      : 'Enter your database details.',
    'Database Configuration'
  );

  // ── Database type ────────────────────────────────────────────────────────────
  const dbType = await select({
    message: 'Database type',
    options: [
      { value: 'postgresql', label: 'PostgreSQL' },
      { value: 'mysql',      label: 'MySQL' },
    ],
    initialValue: existing.DB_TYPE || 'postgresql',
  });
  if (isCancel(dbType)) return cancel('Setup cancelled.');

  const defaultPort = dbType === 'mysql' ? '3306' : '5432';
  const defaultUser = dbType === 'mysql' ? 'root' : 'postgres';

  // ── Host ─────────────────────────────────────────────────────────────────────
  const host = await text({
    message: 'Database host',
    placeholder: 'localhost',
    defaultValue: existing.DB_HOST || 'localhost',
  });
  if (isCancel(host)) return cancel('Setup cancelled.');

  // ── Port ─────────────────────────────────────────────────────────────────────
  const port = await text({
    message: 'Database port',
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
    message: 'Database user',
    placeholder: defaultUser,
    defaultValue: existing.DB_USER || defaultUser,
    validate: (v) => (!v.trim() ? 'Required' : undefined),
  });
  if (isCancel(user)) return cancel('Setup cancelled.');

  // ── Password ─────────────────────────────────────────────────────────────────
  const pwd = await password({
    message: 'Database password',
    validate: (v) => (v === undefined ? 'Required' : undefined),
  });
  if (isCancel(pwd)) return cancel('Setup cancelled.');

  // ── JWT secret ───────────────────────────────────────────────────────────────
  const jwtSecret = await text({
    message: 'JWT secret (leave blank to auto-generate)',
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
    s.start('Connecting to database…');
    const result = await testConnection(url);
    if (result.ok) {
      s.stop(pc.green('✓ Connection successful'));
    } else {
      s.stop(pc.red('✗ Connection failed: ' + result.error));
      const force = await confirm({
        message: 'Save anyway? (you can fix the credentials later)',
        initialValue: false,
      });
      if (isCancel(force) || !force) return cancel('Setup cancelled.');
    }
  }

  // ── Write .env ───────────────────────────────────────────────────────────────
  const secret = jwtSecret || generateSecret();

  const vars = {
    DATABASE_URL: url,
    DB_TYPE: dbType,
    DB_HOST: host || 'localhost',
    DB_PORT: port || defaultPort,
    DB_NAME: database || 'group_cms',
    DB_USER: user || defaultUser,
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
      `${pc.dim('File:')}     ${envPath}`,
      `${pc.dim('Type:')}     ${dbType === 'mysql' ? 'MySQL' : 'PostgreSQL'}`,
      `${pc.dim('Host:')}     ${vars.DB_HOST}:${vars.DB_PORT}`,
      `${pc.dim('Database:')} ${vars.DB_NAME}`,
      `${pc.dim('User:')}     ${vars.DB_USER}`,
    ].join('\n'),
    pc.green('✓ .env written')
  );

  return vars;
}

function generateSecret(len = 48) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
