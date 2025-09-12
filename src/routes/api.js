import { Router } from "express";

const apiRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Azure Speech
 *   description: API for Azure Speech services
 */

/**
 * @swagger
 * /api/speech-config:
 *   get:
 *     summary: Get Azure Speech configuration
 *     tags: [Azure Speech]
 *     responses:
 *       200:
 *         description: The Azure Speech configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 region:
 *                   type: string
 *                 success:
 *                   type: boolean
 *       500:
 *         description: Failed to get speech configuration
 */
apiRouter.get("/api/speech-config", (req, res) => {
  console.log(
    "🎤 GET /api/speech-config - Azure Speech configuration requested"
  );
  console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);

  try {
    console.log(`🌍 Azure Speech Region: ${process.env.AZURE_SPEECH_REGION}`);

    // Return only the necessary configuration without exposing the full key
    const config = {
      region: process.env.AZURE_SPEECH_REGION,
      // We'll use a token-based approach for better security
      success: true,
    };

    console.log("✅ Speech configuration sent successfully");
    res.json(config);
  } catch (error) {
    console.error("❌ Error getting speech config:", error);
    res.status(500).json({ error: "Failed to get speech configuration" });
  }
});

/**
 * @swagger
 * /api/speech-token:
 *   post:
 *     summary: Get Azure Speech token
 *     tags: [Azure Speech]
 *     responses:
 *       200:
 *         description: The Azure Speech token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 region:
 *                   type: string
 *       500:
 *         description: Failed to get speech token
 */
apiRouter.post("/api/speech-token", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;

    const tokenUrl = `https://${process.env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response.ok) {
      const token = await response.text();
      res.json({
        token: token,
        region: process.env.AZURE_SPEECH_REGION,
      });
    } else {
      throw new Error("Failed to get token");
    }
  } catch (error) {
    console.error("Error getting speech token:", error);
    res.status(500).json({ error: "Failed to get speech token" });
  }
});

export default apiRouter;
