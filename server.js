const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { initDb, insertAuditEvent } = require("./db"); // ← Import DB functions

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

// Initialize DB at startup
initDb()
  .then(() => {
    console.log("✅ Database initialized");
  })
  .catch(err => {
    console.error("❌ Failed to initialize DB:", err);
  });

// POST /log - expects a FHIR AuditEvent JSON
app.post("/log", async (req, res) => {
  const body = req.body;

  if (body?.resourceType !== "AuditEvent") {
    return res.status(400).send("Invalid resource: must be an AuditEvent");
  }

  const timestamp = body.recorded || new Date().toISOString();
  const action = body.action || "Unknown";
  const outcome = body.outcome || "Unknown";
  const agent = body.agent?.[0]?.who?.display || "Unknown";
  const patient = body.entity?.find(e => e.what?.reference?.startsWith("Patient/"))?.what?.reference || "N/A";
  const source = body.source?.observer?.reference || "Unknown";

  console.log("📥 Received AuditEvent:");
  console.log(`🕒 Timestamp: ${timestamp}`);
  console.log(`⚙️  Action: ${action}`);
  console.log(`✅ Outcome: ${outcome}`);
  console.log(`👤 Agent: ${agent}`);
  console.log(`🏥 Patient: ${patient}`);
  console.log(`🌐 Source: ${source}`);

  try {
    // Pass the full JSON in fullEvent for DB storage
    await insertAuditEvent({ timestamp, action, outcome, agent, patient, source, fullEvent: body });
    res.status(200).send("AuditEvent logged and saved");
  } catch (err) {
    console.error("❌ Failed to save to DB:", err);
    res.status(500).send("Failed to save AuditEvent");
  }
});

// GET / - health check
app.get("/", (req, res) => {
  res.send("FHIR AuditEvent logging server is up and running!");
});

app.listen(PORT, () => {
  console.log(`🚀 AuditEvent log server listening on port ${PORT}`);
});
