import { Router } from "express";
import heygenService from "../services/heygen.js";
import Session from "../models/session.js";
const heygenRouter = Router();

/**
 * @swagger
 * tags:
 *   name: HeyGen
 *   description: API for HeyGen services
 */

/**
 * @swagger
 * /api/heygen-voices:
 *   get:
 *     summary: Get HeyGen voices
 *     tags: [HeyGen]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: The language of the voices
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: The gender of the voices
 *     responses:
 *       200:
 *         description: A list of voices
 *       500:
 *         description: Failed to fetch HeyGen voices
 */
heygenRouter.get("/api/heygen-voices", async (req, res) => {
  try {
    console.log("🎭 GET /api/heygen-voices - Fetching HeyGen voices");
    const voices = await heygenService.getVoices(
      req.query.language,
      req.query.gender
    );
    res.json(voices);
  } catch (error) {
    console.error("❌ Error fetching HeyGen voices:", error);
    res.status(500).json({ error: "Failed to fetch HeyGen voices" });
  }
});

/**
 * @swagger
 * /api/heygen-avatars:
 *   get:
 *     summary: Get HeyGen avatars
 *     tags: [HeyGen]
 *     parameters:
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: The gender of the avatars
 *     responses:
 *       200:
 *         description: A list of avatars
 *       500:
 *         description: Failed to fetch HeyGen avatars
 */
heygenRouter.get("/api/heygen-avatars", async (req, res) => {
  try {
    console.log("🎭 GET /api/heygen-avatars - Fetching HeyGen avatars");
    const avatars = await heygenService.getAvatars(req.query.gender);
    res.json(avatars);
  } catch (error) {
    console.error("❌ Error fetching HeyGen avatars:", error);
    res.status(500).json({ error: "Failed to fetch HeyGen avatars" });
  }
});

/**
 * @swagger
 * /api/heygen-config:
 *   get:
 *     summary: Get HeyGen configuration
 *     tags: [HeyGen]
 *     responses:
 *       200:
 *         description: The HeyGen configuration
 *       500:
 *         description: Failed to get HeyGen configuration
 */
heygenRouter.get("/api/heygen-config", (req, res) => {
  console.log("🎭 GET /api/heygen-config - HeyGen configuration requested");
  console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);

  try {
    const config = {
      avatarId: process.env.AVATAR_ID,
      voiceId: process.env.VOICE_ID,
      success: true,
    };

    console.log("✅ HeyGen configuration sent successfully");
    res.json(config);
  } catch (error) {
    console.error("❌ Error getting HeyGen config:", error);
    res.status(500).json({ error: "Failed to get HeyGen configuration" });
  }
});

/**
 * @swagger
 * /api/heygen-session:
 *   post:
 *     summary: Create a new HeyGen session
 *     tags: [HeyGen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatarId
 *               - voiceId
 *             properties:
 *               avatarId:
 *                 type: string
 *               voiceId:
 *                 type: string
 *               botId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created session
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to create HeyGen session
 */
heygenRouter.post("/api/heygen-session", async (req, res) => {
  try {
    console.log("🎭 POST /api/heygen-session - Creating HeyGen session");
    const fetch = (await import("node-fetch")).default;
    const { avatarId, voiceId } = req.body;

    if (!avatarId || !voiceId) {
      return res
        .status(400)
        .json({ error: "Avatar ID and Voice ID are required" });
    }

    const data = await heygenService.createSession(avatarId, voiceId);

    if (data?.data?.session_id) {
      console.log("🎟️ Session ID:", data.data.session_id);
      const session = new Session({
        session_id: data.data.session_id,
        bot_id: req.body.botId || null,
        avatar_id: avatarId,
        voice_id: voiceId,
      });
      await session.save();
      console.log("💾 Session saved to database:", session);
    }

    console.log("✅ HeyGen session created successfully", data);

    if (data.data) {
      res.json(data.data);
    } else {
      throw new Error("Invalid response format from HeyGen API");
    }
  } catch (error) {
    console.error("❌ Error creating HeyGen session:", error);
    res.status(500).json({ error: "Failed to create HeyGen session" });
  }
});

/**
 * @swagger
 * /api/heygen-start:
 *   post:
 *     summary: Start a HeyGen session
 *     tags: [HeyGen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - sdp
 *             properties:
 *               sessionId:
 *                 type: string
 *               sdp:
 *                 type: object
 *     responses:
 *       200:
 *         description: Session started
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to start HeyGen session
 */
heygenRouter.post("/api/heygen-start", async (req, res) => {
  try {
    console.log("🎭 POST /api/heygen-start - Starting HeyGen session");
    const fetch = (await import("node-fetch")).default;
    const { sessionId, sdp } = req.body;

    if (!sessionId || !sdp) {
      return res.status(400).json({ error: "Session ID and SDP are required" });
    }

    const response = await fetch("https://api.heygen.com/v1/streaming.start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify({ session_id: sessionId, sdp }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ HeyGen start session error:", errorText);
      throw new Error(`HeyGen API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ HeyGen session started successfully");
    res.json(data.data);
  } catch (error) {
    console.error("❌ Error starting HeyGen session:", error);
    res.status(500).json({ error: "Failed to start HeyGen session" });
  }
});

/**
 * @swagger
 * /api/heygen-ice:
 *   post:
 *     summary: Handle ICE candidates
 *     tags: [HeyGen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - candidate
 *             properties:
 *               sessionId:
 *                 type: string
 *               candidate:
 *                 type: object
 *     responses:
 *       200:
 *         description: ICE candidate handled
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to handle ICE candidate
 */
heygenRouter.post("/api/heygen-ice", async (req, res) => {
  try {
    console.log("🧊 POST /api/heygen-ice - Handling ICE candidate");
    const fetch = (await import("node-fetch")).default;
    const { sessionId, candidate } = req.body;

    if (!sessionId || !candidate) {
      return res
        .status(400)
        .json({ error: "Session ID and candidate are required" });
    }

    const response = await fetch("https://api.heygen.com/v1/streaming.ice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify({ session_id: sessionId, candidate }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ HeyGen ICE error:", errorText);
      throw new Error(`HeyGen API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Error handling ICE candidate:", error);
    res.status(500).json({ error: "Failed to handle ICE candidate" });
  }
});

/**
 * @swagger
 * /api/heygen-speak:
 *   post:
 *     summary: Make avatar speak
 *     tags: [HeyGen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - text
 *             properties:
 *               sessionId:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Avatar speech task sent
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to make avatar speak
 */
heygenRouter.post("/api/heygen-speak", async (req, res) => {
  try {
    console.log("🗣️ POST /api/heygen-speak - Making avatar speak");
    const fetch = (await import("node-fetch")).default;
    const { sessionId, text } = req.body;

    if (!sessionId || !text) {
      return res
        .status(400)
        .json({ error: "Session ID and text are required" });
    }

    console.log(
      `📢 Avatar speaking: "${text.substring(0, 50)}${
        text.length > 50 ? "..." : ""
      }"`
    );

    const response = await fetch("https://api.heygen.com/v1/streaming.task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify({ session_id: sessionId, text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ HeyGen speak error:", errorText);
      throw new Error(`HeyGen API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Avatar speech task sent successfully");
    res.json(data.data);
  } catch (error) {
    console.error("❌ Error making avatar speak:", error);
    res.status(500).json({ error: "Failed to make avatar speak" });
  }
});

/**
 * @swagger
 * /api/heygen-stop:
 *   post:
 *     summary: Stop a HeyGen session
 *     tags: [HeyGen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session stopped
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to stop HeyGen session
 */
heygenRouter.post("/api/heygen-stop", async (req, res) => {
  try {
    console.log("🛑 POST /api/heygen-stop - Stopping HeyGen session");
    const fetch = (await import("node-fetch")).default;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const response = await fetch("https://api.heygen.com/v1/streaming.stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ HeyGen stop session error:", errorText);
      throw new Error(`HeyGen API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ HeyGen session stopped successfully");
    res.json(data.data);
  } catch (error) {
    console.error("❌ Error stopping HeyGen session:", error);
    res.status(500).json({ error: "Failed to stop HeyGen session" });
  }
});

export default heygenRouter;
