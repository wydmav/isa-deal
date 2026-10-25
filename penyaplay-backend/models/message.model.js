
// ──────────────────────────────────────────────
// Penya Play — Message Model
// OS: "isolated event chat boxes"
// OS: "accessible only to the specific promoter and performer"
// ──────────────────────────────────────────────

const { pool } = require('../config/db');

async function create({ bookingId, senderId, senderName, type, content }) {
  const { rows } = await pool.query(
    `INSERT INTO messages (booking_id, sender_id, sender_name, type, content)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [bookingId, senderId || null, senderName, type || 'text', content]
  );
  return rows[0];
}

// OS: row-level — only participants can read
async function findByBooking(bookingId, userId, performerId) {
  const { rows: [booking] } = await pool.query(
    `SELECT promoter_id, performer_id FROM bookings WHERE id = $1`, [bookingId]
  );
  if (!booking) return [];
  // Row-level security enforced in service layer, just return messages here
  const { rows } = await pool.query(
    `SELECT * FROM messages WHERE booking_id = $1 ORDER BY created_at ASC`,
    [bookingId]
  );
  return rows;
}

async function markRead(bookingId, userId) {
  await pool.query(
    `UPDATE messages SET read_at = NOW() WHERE booking_id = $1 AND sender_id != $2 AND read_at IS NULL`,
    [bookingId, userId]
  );
}

async function getUnreadCount(bookingId, userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM messages WHERE booking_id = $1 AND sender_id != $2 AND read_at IS NULL`,
    [bookingId, userId]
  );
  return parseInt(rows[0].count, 10);
}

module.exports = { create, findByBooking, markRead, getUnreadCount };