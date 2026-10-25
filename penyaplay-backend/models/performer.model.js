
// ──────────────────────────────────────────────
// Penya Play — Performer Model
// OS: "performer is the visual and structural centre"
// OS: "new talent starts Pending Review, hidden from public search"
// OS: "area-level location" — never exact addresses
// ──────────────────────────────────────────────

const { pool } = require('../config/db');

async function create({ userId, handle, stageName, professions, area, areaCity, profileImg }) {
  const { rows } = await pool.query(
    `INSERT INTO performers (user_id, handle, stage_name, professions, area, area_city, profile_img)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, handle.toLowerCase().trim(), stageName.trim(), professions, area, areaCity, profileImg || null]
  );
  return rows[0];
}

async function findByHandle(handle) {
  const { rows } = await pool.query(
    `SELECT p.*, u.email as user_email FROM performers p JOIN users u ON p.user_id = u.id WHERE p.handle = $1`,
    [handle.toLowerCase().trim()]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM performers WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM performers WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

// OS: "hidden from all public searches and direct links until admin approves"
async function findApproved(handle) {
  const { rows } = await pool.query(
    `SELECT * FROM performers WHERE handle = $1 AND verification_status = 'approved'`,
    [handle.toLowerCase().trim()]
  );
  return rows[0] || null;
}

// OS: public search — only approved profiles
async function search({ query, category, limit = 50, offset = 0 }) {
  let where = `WHERE p.verification_status = 'approved'`;
  const params = [];
  let i = 1;

  if (query) {
    where += ` AND to_tsvector('english', p.stage_name || ' ' || coalesce(p.bio, '')) @@ plainto_tsquery($${i})`;
    params.push(query);
    i++;
  }
  if (category) {
    where += ` AND $${i} = ANY(p.professions)`;
    params.push(category);
    i++;
  }

  const { rows } = await pool.query(
    `SELECT p.id, p.handle, p.stage_name, p.professions, p.area, p.profile_img,
            (SELECT COUNT(*) FROM reviews r WHERE r.subject_id = p.id) as review_count
     FROM performers p
     ${where}
     ORDER BY p.stage_name ASC
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset]
  );
  return rows;
}

// OS: admin verification queue
async function findPending() {
  const { rows } = await pool.query(
    `SELECT p.*, u.email as user_email FROM performers p JOIN users u ON p.user_id = u.id
     WHERE p.verification_status = 'pending_review' ORDER BY p.created_at ASC`
  );
  return rows;
}

async function updateStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE performers SET verification_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] || null;
}

async function update(id, data) {
  const fields = [];
  const values = [];
  let i = 1;

  for (const [key, val] of Object.entries(data)) {
    if (key === 'professions' && Array.isArray(val)) {
      fields.push(`${key} = $${i}`);
      values.push(val);
    } else {
      fields.push(`${key} = $${i}`);
      values.push(val);
    }
    i++;
  }
  fields.push(`updated_at = NOW()`);

  const { rows } = await pool.query(
    `UPDATE performers SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    [...values, id]
  );
  return rows[0] || null;
}

// Get packages for a performer
async function getPackages(performerId) {
  const { rows } = await pool.query(
    `SELECT * FROM packages WHERE performer_id = $1 AND active = TRUE ORDER BY sort_order ASC`,
    [performerId]
  );
  return rows;
}

module.exports = {
  create, findByHandle, findById, findByUserId, findApproved,
  search, findPending, updateStatus, update, getPackages,
};