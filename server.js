//PROD
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { initDb, insertAuditEvent } = require("./db");

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

  try {
    await insertAuditEvent(body);
    console.log("📥 AuditEvent logged:", body.id || "(no ID)");
    res.status(200).send("AuditEvent saved");
  } catch (err) {
    console.error("❌ Failed to save AuditEvent:", err);
    res.status(500).send("Database error");
  }
});

// GET / - health check
app.get("/", (req, res) => {
  res.send("FHIR AuditEvent logging server is up and running!");
});

app.listen(PORT, () => {
  console.log(`🚀 AuditEvent log server listening on port ${PORT}`);
});