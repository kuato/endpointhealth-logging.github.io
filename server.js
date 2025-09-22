const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT;

// 🐛 Log every incoming request
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  console.log("🔍 Origin:", req.headers.origin);
  console.log("🔍 Headers:", req.headers);
  next();
});

// 🌍 Allow everything for debugging
app.use(cors({
  origin: (origin, callback) => {
    console.log("🌐 CORS origin received:", origin);
    callback(null, origin); // Reflect origin
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 🔧 Middleware
app.use(express.json());
app.use(morgan("combined"));

// ✅ Catch-all OPTIONS handler
app.options('*', (req, res) => {
  console.log("🛫 Handling OPTIONS preflight");
  console.log("🔍 Origin:", req.headers.origin);
  console.log("🔍 Access-Control-Request-Method:", req.headers['access-control-request-method']);
  console.log("🔍 Access-Control-Request-Headers:", req.headers['access-control-request-headers']);

  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  console.log("✅ Responding with 204 No Content");
  res.sendStatus(204);
});

// 📥 POST /log
app.post("/log", async (req, res) => {
  console.log("📥 Received POST /log");
  console.log("🔍 Body:", req.body);
  res.status(200).send("Log received");
});

// 🩺 Health check
app.get("/", (req, res) => {
  console.log("💡 Health check hit");
  res.send("Audit logger is up and wide open for debugging!");
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});