const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT;

// 🌍 Allow everything for debugging
app.use(cors({
  origin: true, // Reflects the request origin
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 🔧 Middleware
app.use(express.json());
app.use(morgan("combined"));

// ✅ Catch-all OPTIONS handler
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
  res.send("Audit logger is up and wide open for debugging!");
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});