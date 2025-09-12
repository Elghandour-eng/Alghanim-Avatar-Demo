import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const staticsRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Statics
 *   description: API for serving static files
 */

/**
 * @swagger
 * /home:
 *   get:
 *     summary: Serve the home page
 *     tags: [Statics]
 *     responses:
 *       200:
 *         description: The home page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
staticsRouter.get("/home", (req, res) => {
  console.log("🏠 GET /home - Serving home.html");
  console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);
  // path join from base directory
  res.sendFile(path.join(__dirname, "../..", "assets", "static", "home.html"));
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Serve the main page
 *     tags: [Statics]
 *     responses:
 *       200:
 *         description: The main page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
staticsRouter.get("/", (req, res) => {
  console.log("📄 GET / - Serving home.html");
  console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);
  res.sendFile(path.join(__dirname, "../..", "assets", "static", "home.html"));
});

export default staticsRouter;
