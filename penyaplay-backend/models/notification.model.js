
// ──────────────────────────────────────────────
// Penya Play — Notification Model
// OS: "in-app is live in Phase 1"
// OS: "a bell with unread count in every signed-in portal"
// ──────────────────────────────────────────────

const { pool } = require('../config/db');

async function create({ userId, title, body, entityType, entityId }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, title, body, entity_type, entity_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, title, body || '', entityType || null, entityId || null]
  );
  return rows[0];
}

async function findByUser(userId, { limit = 30, unreadOnly = false } = {}) {
  let where = `WHERE user_id = $1`;
  const params = [userId];
  let i = 2;

  if (unreadOnly) {
    where += ` AND read_at IS NULL`;
  }

  const { rows } = await pool.query(
    `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $${i}`,
    [...params, limit]
  );
  return rows;
}

async function getUnreadCount(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return parseInt(rows[0].count, 10);
}

async function markRead(notificationId, userId) {
  await pool.query(
    `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
    [notificationId, userId]
  );
}

async function markAllRead(userId) {
  await pool.query(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
}

module.exports = { create, findByUser, getUnreadCount, markRead, markAllRead };