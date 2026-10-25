
// ──────────────────────────────────────────────
// Penya Play — Database Connection Pool
// OS: "daily database backups" (configured in Postgres, not here)
// ──────────────────────────────────────────────

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.PP_DB_URL,
  min: 5,
  max: 20,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
  process.exit(1);
});

module.exports = { pool };