const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { initDb, insertAuditEvent, getAuditReport } = require("./db"); // ← Added getAuditReport

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
    await insertAuditEvent({ timestamp, action, outcome, agent, patient, source, fullEvent: body });
    res.status(200).send("AuditEvent logged and saved");
  } catch (err) {
    console.error("❌ Failed to save to DB:", err);
    res.status(500).send("Failed to save AuditEvent");
  }
});

// GET /report - summary of audit events by agent (optional ?since=YYYY-MM-DD)
app.get("/report", async (req, res) => {
  try {
    const key = req.headers["x-api-key"];
    if (!key || key !== process.env.REPORT_API_KEY) {
      return res.status(403).send("Forbidden");
    }

    const since = req.query.since;
    const report = await getAuditReport(since);
    res.json(report);
  } catch (err) {
    console.error("❌ Error fetching report:", err);
    res.status(500).send("Failed to generate report");
  }
});

// GET / - health check
app.get("/", (req, res) => {
  res.send("FHIR AuditEvent logging server is up and running!");
});

app.listen(PORT, () => {
  console.log(`🚀 AuditEvent log server listening on port ${PORT}`);
});
