const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Determine schema based on ENV
const ENV = process.env.ENV || "dev";
const SCHEMA = `audit_${ENV}`;
const TABLE = `${SCHEMA}.events`;

/**
 * Initialize the database by creating the schema and events table if they don't exist.
 */
async function initDb() {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      recorded_at TIMESTAMPTZ DEFAULT NOW(),
      payload JSONB NOT NULL
    )
  `);
}

/**
 * Insert a full AuditEvent payload into the appropriate schema.
 * @param {object} auditEvent - Full FHIR AuditEvent JSON
 */
async function insertAuditEvent(auditEvent) {
  await pool.query(
    `INSERT INTO ${TABLE} (payload) VALUES ($1)`,
    [auditEvent]
  );
}

module.exports = { initDb, insertAuditEvent };