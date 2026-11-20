/*
 * Purpose: Main backend entry point. Starts the Express server, connects to MongoDB, configures middleware, serves the frontend, and registers the API routes.
 * This file documents its responsibility; application logic is unchanged.
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3000;

// Production deployments must provide real secrets through the host's environment settings.
if (isProduction) {
  const required = ["MONGODB_URI", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error("Missing required production environment variables:", missing.join(", "));
    process.exit(1);
  }
}

// Convenient local-development defaults only. Never use these for a public deployment.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quickservice";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@123";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@1234";
const JWT_SECRET = process.env.JWT_SECRET || "local-development-secret-change-before-deploying";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use("/api/providers", require("./routes/providers"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/ratings", require("./routes/ratings"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found." }));

const publicDirectory = path.join(__dirname, "..", "frontend");
app.use(express.static(publicDirectory));
app.get("/", (req, res) => res.sendFile(path.join(publicDirectory, "pp.html")));

// Always return JSON for API errors so the frontend can show a useful message.
app.use((err, req, res, next) => {
  console.error("Request error:", err.message);
  if (req.path.startsWith("/api/")) {
    return res.status(err.status || 500).json({ error: "The server could not complete this request." });
  }
  res.status(err.status || 500).send("Something went wrong. Please try again.");
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    app.locals.adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`QuickService is running on port ${PORT}`);
      console.log("MongoDB connected successfully.");
    });
  } catch (error) {
    console.error("QuickService startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
