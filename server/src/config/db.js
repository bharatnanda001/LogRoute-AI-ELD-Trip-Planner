// server/src/config/db.js
// ═══════════════════════════════════════════════════════════════════
// PostgreSQL connection pool — uses DATABASE_URL from .env
// ═══════════════════════════════════════════════════════════════════

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For SSL on managed Postgres (Render, Supabase, etc.)
  ssl: process.env.DATABASE_URL?.includes('render.com') ||
       process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export default pool;

/**
 * Run a query against the pool.
 * @param {string} text — SQL query
 * @param {any[]} params — parameterized values
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DB] ${duration}ms | ${text.slice(0, 80)}...`);
  }
  return res;
}
