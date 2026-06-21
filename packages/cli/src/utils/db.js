import pg from 'pg';
const { Client } = pg;

/**
 * Test a PostgreSQL connection. Returns { ok, error }.
 */
export async function testConnection(url) {
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
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

/**
 * Build a PostgreSQL connection URL from parts.
 */
export function buildUrl({ host, port, database, user, password }) {
  const encoded = encodeURIComponent(password);
  return `postgresql://${user}:${encoded}@${host}:${port}/${database}`;
}
