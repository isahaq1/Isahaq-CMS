/**
 * Build a database connection URL from parts.
 * dbType: 'postgresql' | 'mysql'
 */
export function buildUrl({ dbType = 'postgresql', host, port, database, user, password }) {
  const encoded = encodeURIComponent(password);
  const scheme = dbType === 'mysql' ? 'mysql' : 'postgresql';
  return `${scheme}://${user}:${encoded}@${host}:${port}/${database}`;
}

/**
 * Parse a database URL into its component parts.
 */
export function parseDbUrl(url) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port || (url.startsWith('mysql') ? '3306' : '5432'),
      database: u.pathname.replace(/^\//, ''),
      user: u.username,
      password: decodeURIComponent(u.password),
    };
  } catch {
    return null;
  }
}

/**
 * Ensure the target database exists — create it if it doesn't.
 * Connects to the server admin database (postgres / no-db mysql) so it works
 * even when the target DB has never been created.
 * Returns { ok, created, error }
 */
export async function ensureDatabase({ dbType = 'postgresql', host, port, database, user, password }) {
  if (dbType === 'mysql') {
    return ensureMysqlDb({ host, port, database, user, password });
  }
  return ensurePostgresDb({ host, port, database, user, password });
}

async function ensurePostgresDb({ host, port, database, user, password }) {
  const { default: pg } = await import('pg');
  // Connect to the 'postgres' system database (always exists) to manage DBs
  const client = new pg.Client({
    host,
    port: Number(port),
    user,
    password,
    database: 'postgres',
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [database]
    );
    let created = false;
    if (res.rows.length === 0) {
      // Use double-quoted identifier to handle special chars / reserved words
      await client.query(`CREATE DATABASE "${database}"`);
      created = true;
    }
    await client.end();
    return { ok: true, created };
  } catch (err) {
    try { await client.end(); } catch {}
    return { ok: false, error: err.message };
  }
}

async function ensureMysqlDb({ host, port, database, user, password }) {
  try {
    const mysql2 = await import('mysql2/promise');
    // Connect without specifying a database so we can create it
    const conn = await mysql2.default.createConnection({
      host,
      port: Number(port),
      user,
      password,
    });
    const [rows] = await conn.query('SHOW DATABASES LIKE ?', [database]);
    const exists = Array.isArray(rows) && rows.length > 0;
    if (!exists) {
      await conn.query(
        `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    }
    await conn.end();
    return { ok: true, created: !exists };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Test a database connection. Returns { ok, error }.
 * Detects driver from URL scheme.
 */
export async function testConnection(url) {
  if (url.startsWith('mysql://')) {
    return testMysql(url);
  }
  return testPostgres(url);
}

async function testPostgres(url) {
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return { ok: true };
  } catch (err) {
    try { await client.end(); } catch {}
    return { ok: false, error: err.message };
  }
}

async function testMysql(url) {
  try {
    const mysql2 = await import('mysql2/promise');
    const conn = await mysql2.default.createConnection(url);
    await conn.query('SELECT 1');
    await conn.end();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
