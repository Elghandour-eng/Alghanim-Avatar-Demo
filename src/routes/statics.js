const { Router } = require("express");
const path = require("path");

const staticsRouter = Router();
module.exports = staticsRouter;

// Also serve home.html directly
staticsRouter.get("/home", (req, res) => {
  console.log("🏠 GET /home - Serving home.html");
  console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);
  // path join from base directory
  res.sendFile(path.join(__dirname, "../..", "assets", "static", "home.html"));
});
// Serve the main HTML file at root
staticsRouter.get("/", (req, res) => {
  console.log("📄 GET / - Serving home.html");
  console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);
  res.sendFile(path.join(__dirname, "../..", "assets", "static", "home.html"));
});
