const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { initDb, insertAuditEvent } = require("./db");

const app = express();
const PORT = process.env.PORT;

// 🔒 Whitelisted frontend domains
const allowedOrigins = [
  "https://uat.endpointhealth.ca",
  "https://dev.endpointhealth.ca",
  "https://launch.endpointhealth.ca"
];

// 🐛 Debug incoming requests
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  console.log("🔍 Origin:", req.headers.origin);
  console.log("🔍 Headers:", req.headers);
  next();
});

// 🌍 CORS setup with strict origin filtering
app.use(cors({
  origin: function (origin, callback) {
    console.log("🌐 CORS origin received:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("🚫 CORS blocked for origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

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

// 📥 POST /log - expects a FHIR AuditEvent JSON
app.post("/log", async (req, res) => {
  const body = req.body;

  if (body?.resourceType !== "AuditEvent") {
    console.warn("⚠️ Invalid resource:", body);
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

// 🩺 GET / - health check
app.get("/", (req, res) => {
  console.log("💡 Health check hit");
  res.send("FHIR AuditEvent logging server is up and running!");
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 AuditEvent log server listening on port ${PORT}`);
});