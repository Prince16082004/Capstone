const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

require("./config/jwt");

// Connect to MongoDB
connectDB();

const app = express();

// --- Middleware ---
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      return callback(null, !origin || allowedOrigins.includes(origin));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Routes ---
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/weather", require("./routes/weatherRoutes"));
app.use("/api/crop", require("./routes/cropRoutes"));
app.use("/api/disease", require("./routes/diseaseRoutes"));
app.use("/api/irrigation", require("./routes/irrigationRoutes"));
app.use("/api/fertilizer", require("./routes/fertilizerRoutes"));
app.use("/api/market", require("./routes/marketRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/government", require("./routes/governmentRoutes"));
app.use("/api/soil", require("./routes/soilRoutes"));
app.use("/api/schemes", require("./routes/schemeRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AgriSense API is running 🌱",
    endpoints: [
      "/api/weather",
      "/api/crop/ml-recommend",
      "/api/crop/recommend (DEPRECATED — use ml-recommend)",
      "/api/disease/detect",
      "/api/irrigation/calculate",
      "/api/fertilizer/calculate",
      "/api/market",
      "/api/chat",
      "/api/contact"
    ]
  });
});

// Serve frontend build if present (client/dist)
const fs = require("fs");
const clientDistPath = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 AgriSense API running on http://localhost:${PORT}`);
});
