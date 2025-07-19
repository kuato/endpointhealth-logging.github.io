const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

// POST /log - expects a FHIR AuditEvent JSON
app.post("/log", (req, res) => {
  const body = req.body;

  // ✅ Minimal validation
  if (body?.resourceType !== "AuditEvent") {
    return res.status(400).send("Invalid resource: must be an AuditEvent");
  }

  // 🧠 Extract meaningful info for logs
  const timestamp = body.recorded || "Unknown";
  const action = body.action || "Unknown";
  const outcome = body.outcome || "Unknown";
  const agent = body.agent?.[0]?.who?.identifier?.value || "Unknown";
  const patient = body.entity?.find((e) => e.what?.reference?.startsWith("Patient/"))?.what?.reference || "N/A";
  const source = body.source?.observer?.identifier?.value || "Unknown";

  console.log("📥 Received AuditEvent:");
  console.log(`🕒 Timestamp: ${timestamp}`);
  console.log(`⚙️  Action: ${action}`);
  console.log(`✅ Outcome: ${outcome}`);
  console.log(`👤 Agent (client/practitioner): ${agent}`);
  console.log(`🏥 Patient: ${patient}`);
  console.log(`🌐 Source (App URL): ${source}`);
  console.log("🔍 Full AuditEvent:", JSON.stringify(body, null, 2));

  res.status(200).send("AuditEvent logged");
});

// GET / - health check
app.get("/", (req, res) => {
  res.send("FHIR AuditEvent logging server is up and running!");
});

app.listen(PORT, () => {
  console.log(`🚀 AuditEvent log server listening on port ${PORT}`);
});
