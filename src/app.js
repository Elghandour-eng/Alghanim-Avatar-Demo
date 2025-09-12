const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const heygenRouter = require("./routes/heygen.js");
const difyRouter = require("./routes/dify.js");
const apiRouter = require("./routes/api.js");
const staticsRouter = require("./routes/statics.js");

console.log("🚀 Starting Al Sayer Toyota Avatar Demo Server...");
console.log("📋 Environment variables loaded");
console.log(`🔧 Node environment: ${process.env.NODE_ENV || "development"}`);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (but exclude HTML files from root to avoid conflicts)
app.use(
  express.static(".", {
    index: false, // Disable automatic index.html serving
  })
);

app.use("/", heygenRouter);
app.use("/", difyRouter);
app.use("/", apiRouter);
app.use("/", staticsRouter);

module.exports = app;
