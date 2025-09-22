const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { initDb, insertAuditEvent } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔍 Log incoming Origin headers for debugging
app.use((req, res, next) => {
  console.log("🔍 Incoming Origin:", req.headers.origin);
  next();
});

// ✅ Allowed origins
const allowedOrigins = [
  'https://uat.endpointhealth.ca',
  'https://dev.endpointhealth.ca',
  'https://launch.endpointhealth.ca',
];

// ✅ CORS middleware — reject silently instead of throwing
app.use(cors({
  origin: function (origin, callback) {
    console.log("🔍 CORS check for origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      console.log("✅ Origin allowed:", origin);
      callback(null, true);
    } else {
      console.warn("❌ Origin blocked by CORS:", origin);
      callback(null, false); // ✅ Don't throw — just reject silently
    }
  },
  credentials: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ✅ Catch-all OPTIONS handler for preflight
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    console.log("✅ Preflight passed for:", origin);
    res.sendStatus(204);
  } else {
    console.warn("❌ Preflight blocked for origin:", origin);
    res.sendStatus(403);
  }
});

// 🔧 Middleware
app.use(express.json());
app.use(morgan("combined"));

// 🛠️ DB init
initDb()
  .then(() => {
    console.log("✅ Database initialized");
  })
  .catch(err => {
    console.error("❌ Failed to initialize DB:", err);
  });

// 📥 POST /log
app.post("/log", async (req, res) => {
  const body = req.body;

  if (body?.resourceType !== "AuditEvent") {
    console.warn("⚠️ Invalid AuditEvent received");
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

// 🩺 Health check
app.get("/", (req, res) => {
  res.send("FHIR AuditEvent logging server is up and running!");
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 AuditEvent log server listening on port ${PORT}`);
});