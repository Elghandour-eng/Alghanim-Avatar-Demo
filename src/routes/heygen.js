import { Router } from "express";
import heygenService from "../services/Heygen.js";
import Session from "../models/Session.js";
const heygenRouter = Router();

export default heygenRouter;

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

// API endpoint to get HeyGen configuration
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

// API endpoint to create HeyGen session
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
        bot_id: "heygen-bot",
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

// API endpoint to start HeyGen session
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

// API endpoint to handle ICE candidates
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

// API endpoint to make avatar speak
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

// API endpoint to stop HeyGen session
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
