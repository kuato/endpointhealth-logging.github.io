const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Set this to Render's internal DB URL
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Initialize the database by creating the audit_events table if it doesn't exist.
 */
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

/**
 * Insert a new AuditEvent record into the database.
 * @param {object} auditEventData
 * @param {string} auditEventData.timestamp - ISO timestamp of the event
 * @param {string} auditEventData.action - Action code
 * @param {string} auditEventData.outcome - Outcome code
 * @param {string} auditEventData.agent - Agent display/name
 * @param {string} auditEventData.patient - Patient reference
 * @param {string} auditEventData.source - Source reference
 * @param {object} auditEventData.fullEvent - Full original AuditEvent JSON
 */
async function insertAuditEvent({ timestamp, action, outcome, agent, patient, source, fullEvent }) {
  await pool.query(
    `INSERT INTO audit_events (timestamp, action, outcome, agent, patient, source, full_event)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [timestamp, action, outcome, agent, patient, source, fullEvent]
  );
}

/**
 * Retrieve a report summary grouped by agent, optionally filtered by a start date.
 * @param {string} since - Optional ISO date string filter (e.g., "2025-07-01")
 * @returns {Promise<Array<{ agent: string, access_count: number, last_access: string }>>}
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


/**
 * Retrieve message count grouped by provider, filtered between two dates.
 * @param {string} from - Start date (ISO format, e.g., "2025-07-01")
 * @param {string} to - End date (ISO format, e.g., "2025-07-15")
 * @returns {Promise<Array<{ provider: string, message_count: number }>>}
 */
/**
 * Retrieve message count grouped by provider and source, between two dates.
 * @param {string} from - Start date (ISO format)
 * @param {string} to - End date (ISO format)
 * @returns {Promise<Array<{ provider: string, source: string, message_count: number }>>}
 */
async function getMessageCountByProviderBetweenDates(from, to) {
  const query = `
    SELECT 
      agent AS provider,
      source,
      COUNT(*) AS message_count
    FROM audit_events
    WHERE timestamp >= $1 AND timestamp < $2
    GROUP BY agent, source
    ORDER BY message_count DESC
  `;
  const values = [from, to];

  const { rows } = await pool.query(query, values);
  return rows;
}

module.exports = { initDb, insertAuditEvent, getAuditReport, getMessageCountByProviderBetweenDates };
