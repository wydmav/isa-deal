
// ──────────────────────────────────────────────
// Penya Play — Audit Log (Append Only)
// OS: "audit logs on sensitive actions"
// OS: "no UPDATE or DELETE permitted on this table"
// ──────────────────────────────────────────────

const { pool } = require('../config/db');

async function log({ actorId, actionType, entityType, entityId, previousState, newState, ipAddress, userAgent }) {
  await pool.query(
    `INSERT INTO audit_log (actor_id, action_type, entity_type, entity_id, previous_state, new_state, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8)`,
    [actorId, actionType, entityType, entityId, JSON.stringify(previousState || {}), JSON.stringify(newState || {}), ipAddress, userAgent]
  );
}

async function findByEntity(entityType, entityId, limit = 50) {
  const { rows } = await pool.query(
    `SELECT * FROM audit_log WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC LIMIT $3`,
    [entityType, entityId, limit]
  );
  return rows;
}

module.exports = { log, findByEntity };