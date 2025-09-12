import express from "express";
import cors from "cors";
import "dotenv/config";

import staticsRouter from "./routes/statics.js";
import apiRouter from "./routes/index.js";
import swaggerUi from "swagger-ui-express";
import specs from "./config/swagger.js";

console.log("🚀 Starting Al Sayer Toyota Avatar Demo Server...");
console.log("📋 Environment variables loaded");
console.log(`🔧 Node environment: ${process.env.NODE_ENV || "development"}`);

const app = express();

// Middleware
app.use(
  cors({
    origin: "*", // Adjust this in production for better security
  })
);
app.use(express.json());

// Serve static files (but exclude HTML files from root to avoid conflicts)
app.use(
  express.static(".", {
    index: false, // Disable automatic index.html serving
  })
);

app.use("/", staticsRouter);
app.use("/api", apiRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
