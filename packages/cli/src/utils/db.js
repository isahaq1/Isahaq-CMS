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
