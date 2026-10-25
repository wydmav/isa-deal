
// ──────────────────────────────────────────────
// Penya Play — Review Model
// OS: "exactly one review per side, 1–5 stars plus text"
// OS: "reviews are permanent"
// ──────────────────────────────────────────────

const { pool } = require('../config/db');

async function create({ bookingId, reviewerId, reviewerName, subjectId, subjectName, rating, comment }) {
  const { rows } = await pool.query(
    `INSERT INTO reviews (booking_id, reviewer_id, reviewer_name, subject_id, subject_name, rating, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [bookingId, reviewerId, reviewerName, subjectId, subjectName, rating, comment]
  );
  return rows[0] || null;
}

// OS: "Professional Reputation derives only from verifiable events"
async function findByPerformer(performerId) {
  const { rows } = await pool.query(
    `SELECT r.*, u.email as reviewer_email
     FROM reviews r JOIN users u ON r.reviewer_id = u.id
     WHERE r.subject_id = $1 ORDER BY r.created_at DESC`,
    [performerId]
  );
  return rows;
}

async function findByBooking(bookingId) {
  const { rows } = await pool.query(
    `SELECT * FROM reviews WHERE booking_id = $1`, [bookingId]
  );
  return rows;
}

async function getAggregate(performerId) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) as total_reviews,
       ROUND(AVG(rating)::numeric, 1) as average_rating
     FROM reviews WHERE subject_id = $1`,
    [performerId]
  );
  return rows[0];
}

module.exports = { create, findByPerformer, findByBooking, getAggregate };