const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { initDb, insertAuditEvent } = require("./db");

const app = express();
app.options('*', cors());

const PORT = process.env.PORT; // ✅ Required for Render routing

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




// ✅ Explicit OPTIONS handler for /log to prevent 404
 /* app.options('/log', (req, res) => {
  console.log("🔍 Preflight request for /log from origin:", req.headers.origin);
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
*/


const corsOptions = {
    origin: 'https://uat.endpointhealth.ca', // Allow only this domain
    methods: 'GET,POST', // Allow only specific HTTP methods
    allowedHeaders: 'Content-Type,Authorization' // Allow specific headers
};


app.options('*', cors());

// 🔧 Middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan("combined"));

app.options('*', cors());

// 📥 POST /log
app.post("/log", async (req, res) => {
  console.log("📥 /log POST received from origin:", req.headers.origin);
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
  res.send("FHIR AuditEvent logging server is up and running!!");
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 AuditEvent log server listening on port ${PORT}`);
});