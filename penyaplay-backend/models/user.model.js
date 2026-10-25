
// ──────────────────────────────────────────────
// Penya Play — User Model
// OS: "no DELETE operations"
// ──────────────────────────────────────────────

const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function create({ email, password, role, name, areaCity }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, area_city) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, name, area_city, created_at`,
    [email.toLowerCase().trim(), passwordHash, role, name.trim(), areaCity || null]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT id, email, role, name, area_city, created_at FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
}

// OS: soft status change only — "deactivation (soft — status field)"
async function update(id, data) {
  const fields = [];
  const values = [];
  let i = 1;

  for (const [key, val] of Object.entries(data)) {
    fields.push(`${key} = $${i}`);
    values.push(val);
    i++;
  }
  fields.push(`updated_at = NOW()`);

  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, email, role, name, area_city, created_at`,
    [...values, id]
  );
  return rows[0] || null;
}

module.exports = { create, findById, findByEmail, update };