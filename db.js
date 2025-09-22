const { Pool } = require("pg");

// Create a connection pool using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render's managed PostgreSQL
  },
});

// Validate and determine schema based on ENV
const VALID_ENVS = ["dev", "uat", "prd"];
const ENV = VALID_ENVS.includes(process.env.ENV) ? process.env.ENV : "dev";
const SCHEMA = `audit_${ENV}`;
const TABLE = `${SCHEMA}.events`;

console.log(`🔌 Using schema: ${SCHEMA}`);
console.log(`🔌 Using table: ${TABLE}`);
console.log(`🔌 Using ENV: ${ENV}`);

/**
 * Initialize the database by creating the schema and events table if they don't exist.
 */
async function initDb() {
  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        id SERIAL PRIMARY KEY,
        recorded_at TIMESTAMPTZ DEFAULT NOW(),
        payload JSONB NOT NULL
      )
    `);
    console.log(`✅ Initialized schema: ${SCHEMA}`);
  } catch (err) {
    console.error("❌ DB init failed:", err);
    throw err;
  }
}

/**
 * Insert a full AuditEvent payload into the appropriate schema.
 * @param {object} auditEvent - Full FHIR AuditEvent JSON
 */
async function insertAuditEvent(auditEvent) {
  try {
    await pool.query(
      `INSERT INTO ${TABLE} (payload) VALUES ($1)`,
      [auditEvent]
    );
  } catch (err) {
    console.error("❌ Failed to insert AuditEvent:", err);
    throw err;
  }
}

/**
 * Optional: Close the DB connection pool (useful for scripts or tests)
 */
function closeDb() {
  return pool.end();
}

module.exports = { initDb, insertAuditEvent, closeDb };