const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // from Render
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL,
      action TEXT,
      outcome TEXT,
      agent TEXT,
      patient TEXT,
      source TEXT,
      full_event JSONB NOT NULL
    )
  `);
}

async function insertAuditEvent({ timestamp, action, outcome, agent, patient, source, fullEvent }) {
  await pool.query(
    `INSERT INTO audit_events (timestamp, action, outcome, agent, patient, source, full_event)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [timestamp, action, outcome, agent, patient, source, fullEvent]
  );
}

/**
 * Get report summary grouped by agent with optional date filter.
 * @param {string} since - ISO date string (e.g., "2025-07-01")
 */
async function getAuditReport(since) {
  let query = `
    SELECT 
      agent,
      COUNT(*) AS access_count,
      MAX(timestamp) AS last_access
    FROM audit_events
  `;
  const values = [];

  if (since) {
    query += ` WHERE timestamp >= $1`;
    values.push(since);
  }

  query += ` GROUP BY agent ORDER BY last_access DESC`;

  const { rows } = await pool.query(query, values);
  return rows;
}

module.exports = { initDb, insertAuditEvent, getAuditReport };
