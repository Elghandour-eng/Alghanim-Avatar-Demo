import express from "express";
import cors from "cors";
import "dotenv/config";

import heygenRouter from "./routes/heygen.js";
import difyRouter from "./routes/dify.js";
import apiRouter from "./routes/api.js";
import staticsRouter from "./routes/statics.js";

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

export default app;
