import {
  text, password, confirm, spinner, note, isCancel, cancel,
} from '@clack/prompts';
import pc from 'picocolors';
import { testConnection, buildUrl } from '../utils/db.js';
import { readEnv, writeEnv } from '../utils/env.js';
import path from 'path';

export async function runSetup(projectDir) {
  const existing = readEnv(projectDir);

  note(
    existing.DATABASE_URL
      ? pc.yellow('DATABASE_URL already exists — values below will update it.')
      : 'Enter your PostgreSQL database details.',
    'Database Configuration'
  );

  // ── Prompt ──────────────────────────────────────────────────────────────────

  const host = await text({
    message: 'Database host',
    placeholder: 'localhost',
    defaultValue: existing.DB_HOST || 'localhost',
  });
  if (isCancel(host)) return cancel('Setup cancelled.');

  const port = await text({
    message: 'Database port',
    placeholder: '5432',
    defaultValue: existing.DB_PORT || '5432',
    validate: (v) => (isNaN(Number(v)) ? 'Must be a number' : undefined),
  });
  if (isCancel(port)) return cancel('Setup cancelled.');

  const database = await text({
    message: 'Database name',
    placeholder: 'group_cms',
    defaultValue: existing.DB_NAME || 'group_cms',
    validate: (v) => (!v.trim() ? 'Required' : undefined),
  });
  if (isCancel(database)) return cancel('Setup cancelled.');

  const user = await text({
    message: 'Database user',
    placeholder: 'postgres',
    defaultValue: existing.DB_USER || 'postgres',
    validate: (v) => (!v.trim() ? 'Required' : undefined),
  });
  if (isCancel(user)) return cancel('Setup cancelled.');

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
    host: host || 'localhost',
    port: port || '5432',
    database: database || 'group_cms',
    user: user || 'postgres',
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
    DB_HOST: host || 'localhost',
    DB_PORT: port || '5432',
    DB_NAME: database || 'group_cms',
    DB_USER: user || 'postgres',
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
