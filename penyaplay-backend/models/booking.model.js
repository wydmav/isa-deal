
// ──────────────────────────────────────────────
// Penya Play — Booking Model
// OS: "the spine" of the platform
// OS: "records are never deleted"
// OS: "row-level security on every table"
// OS: "integer minor units plus explicit ISO currency code"
// ──────────────────────────────────────────────

const { pool } = require('../config/db');
const { STATUS_FLOW } = require('../config/constants');

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO bookings (performer_id, performer_name, performer_handle,
       promoter_id, promoter_name, promoter_email, promoter_phone,
       status, event_date, event_type, budget_amount, budget_currency,
       duration, venue, city, country, requirements, deposit_pct, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING *`,
    [
      data.performerId, data.performerName, data.performerHandle,
      data.promoterId, data.promoterName, data.promoterEmail, data.promoterPhone,
      data.status || 'new', data.eventDate, data.eventType,
      data.budgetAmount, data.budgetCurrency, data.duration,
      data.venue, data.city, data.country, data.requirements,
      data.depositPct || 50, data.source,
    ]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [id]);
  return rows[0] || null;
}

// OS: "one performer can never read another performer's enquiries"
async function findByPerformer(performerId, { status, limit = 50, offset = 0 } = {}) {
  let where = `WHERE performer_id = $1`;
  const params = [performerId];
  let i = 2;

  if (status) {
    where += ` AND status = $${i}`;
    params.push(status);
    i++;
  }

  const { rows } = await pool.query(
    `SELECT * FROM bookings ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset]
  );
  return rows;
}

// OS: row-level — only own bookings
async function findByPromoter(promoterId, { status, limit = 50, offset = 0 } = {}) {
  let where = `WHERE promoter_id = $1`;
  const params = [promoterId];
  let i = 2;

  if (status) {
    where += ` AND status = $${i}`;
    params.push(status);
    i++;
  }

  const { rows } = await pool.query(
    `SELECT * FROM bookings ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset]
  );
  return rows;
}

// OS: admin only — no scope filter
async function findAll({ status, limit = 100, offset = 0 } = {}) {
  let where = '';
  const params = [];
  let i = 1;

  if (status) {
    where = `WHERE status = $${i}`;
    params.push(status);
    i++;
  }

  const { rows } = await pool.query(
    `SELECT * FROM bookings ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset]
  );
  return rows;
}

async function countByPerformer(performerId) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'new') as new_count,
       COUNT(*) FILTER (WHERE status NOT IN ('completed','declined','expired','cancelled')) as active,
       COUNT(*) FILTER (WHERE status = 'completed') as completed
     FROM bookings WHERE performer_id = $1`,
    [performerId]
  );
  return rows[0];
}

async function countByPromoter(promoterId) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status NOT IN ('completed','declined','expired','cancelled')) as active,
       COUNT(*) FILTER (WHERE status = 'confirmed' OR status = 'paid') as confirmed,
       COUNT(*) FILTER (WHERE status = 'completed') as completed
     FROM bookings WHERE promoter_id = $1`,
    [promoterId]
  );
  return rows[0];
}

// OS: FSM enforcement — "no status transition outside the defined map"
async function transitionStatus(id, newStatus) {
  const { rows: [current] } = await pool.query(
    `SELECT status, performer_id, promoter_id FROM bookings WHERE id = $1`, [id]
  );
  if (!current) return null;

  const allowed = STATUS_FLOW[current.status] || [];
  if (!allowed.includes(newStatus)) return null;

  const { rows } = await pool.query(
    `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newStatus, id]
  );
  return rows[0] || null;
}

// OS: manual payment — "mark as paid offline"
async function markPaidOffline(id, adminOrPromoterId) {
  const { rows } = await pool.query(
    `UPDATE bookings SET status = 'paid', paid_offline_at = NOW(), paid_offline_by = $1, updated_at = NOW()
     WHERE id = $2 AND status = 'confirmed' RETURNING *`,
    [adminOrPromoterId, id]
  );
  return rows[0] || null;
}

// OS: "24-hour duplicate-enquiry guard"
async function checkDuplicate(promoterEmail, performerId) {
  const { rows } = await pool.query(
    `SELECT id FROM enquiry_guard
     WHERE promoter_email = $1 AND performer_id = $2
     AND created_at > NOW() - INTERVAL '24 hours'`,
    [promoterEmail.toLowerCase().trim(), performerId]
  );
  return rows.length > 0;
}

async function insertEnquiryGuard(promoterEmail, performerId) {
  await pool.query(
    `INSERT INTO enquiry_guard (promoter_email, performer_id) VALUES ($1, $2)`,
    [promoterEmail.toLowerCase().trim(), performerId]
  );
}

// Store quote amount on booking
async function setQuote(bookingId, amount, currency) {
  const { rows } = await pool.query(
    `UPDATE bookings SET quote_amount = $1, quote_currency = $2, updated_at = NOW()
     WHERE id = $3 AND status IN ('new', 'viewed') RETURNING *`,
    [amount, currency, bookingId]
  );
  return rows[0] || null;
}

module.exports = {
  create, findById, findByPerformer, findByPromoter, findAll,
  countByPerformer, countByPromoter, transitionStatus,
  markPaidOffline, checkDuplicate, insertEnquiryGuard, setQuote,
};