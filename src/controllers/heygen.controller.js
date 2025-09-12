import heygenService from "../services/heygen.js";
import Session from "../models/session.js";
import config from "../config/config.js";
import { processInactiveSessions } from "../jobs/sessionProcessor.js";
const heygenController = {
  async getVoices(req, res) {
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
  },

  async getAvatars(req, res) {
    try {
      console.log("🎭 GET /api/heygen-avatars - Fetching HeyGen avatars");
      const avatars = await heygenService.getAvatars(req.query.gender);
      res.json(avatars);
    } catch (error) {
      console.error("❌ Error fetching HeyGen avatars:", error);
      res.status(500).json({ error: "Failed to fetch HeyGen avatars" });
    }
  },

  getConfig(req, res) {
    console.log("🎭 GET /api/heygen-config - HeyGen configuration requested");
    console.log(
      `🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`
    );

    try {
      const heygenConfig = {
        avatarId: config.AVATAR_ID,
        voiceId: config.VOICE_ID,
        success: true,
      };

      console.log("✅ HeyGen configuration sent successfully");
      res.json(heygenConfig);
    } catch (error) {
      console.error("❌ Error getting HeyGen config:", error);
      res.status(500).json({ error: "Failed to get HeyGen configuration" });
    }
  },

  async createSession(req, res) {
    try {
      console.log("🎭 POST /api/heygen-session - Creating HeyGen session");
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
  },

  async startSession(req, res) {
    try {
      console.log("🎭 POST /api/heygen-start - Starting HeyGen session");
      const { sessionId, sdp } = req.body;

      if (!sessionId || !sdp) {
        return res
          .status(400)
          .json({ error: "Session ID and SDP are required" });
      }

      const data = await heygenService.startSession(sessionId, sdp);
      console.log("✅ HeyGen session started successfully");
      res.json(data);
    } catch (error) {
      console.error("❌ Error starting HeyGen session:", error);
      res.status(500).json({ error: "Failed to start HeyGen session" });
    }
  },

  async handleIce(req, res) {
    try {
      console.log("🧊 POST /api/heygen-ice - Handling ICE candidate");
      const { sessionId, candidate } = req.body;

      if (!sessionId || !candidate) {
        return res
          .status(400)
          .json({ error: "Session ID and candidate are required" });
      }

      const data = await heygenService.handleIce(sessionId, candidate);
      res.json(data);
    } catch (error) {
      console.error("❌ Error handling ICE candidate:", error);
      res.status(500).json({ error: "Failed to handle ICE candidate" });
    }
  },

  async speak(req, res) {
    try {
      console.log("🗣️ POST /api/heygen-speak - Making avatar speak");
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

      const data = await heygenService.speak(sessionId, text);
      console.log("✅ Avatar speech task sent successfully");
      res.json(data);
    } catch (error) {
      console.error("❌ Error making avatar speak:", error);
      res.status(500).json({ error: "Failed to make avatar speak" });
    }
  },

  async stopSession(req, res) {
    try {
      console.log("🛑 POST /api/heygen-stop - Stopping HeyGen session");
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      const data = await heygenService.stopSession(sessionId);
      console.log("✅ HeyGen session stopped successfully");
      res.json(data);
      await processInactiveSessions(sessionId);
    } catch (error) {
      console.error("❌ Error stopping HeyGen session:", error);
      res.status(500).json({ error: "Failed to stop HeyGen session" });
    }
  },
};

export default heygenController;
