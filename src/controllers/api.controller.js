import apiService from "../services/api.service.js";

const apiController = {
  getSpeechConfig(req, res) {
    try {
      console.log(
        "🎤 GET /api/speech-config - Azure Speech configuration requested"
      );
      console.log(
        `🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`
      );
      const config = apiService.getSpeechConfig();
      console.log("✅ Speech configuration sent successfully");
      res.json(config);
    } catch (error) {
      console.error("❌ Error getting speech config:", error);
      res.status(500).json({ error: "Failed to get speech configuration" });
    }
  },

  async getSpeechToken(req, res) {
    try {
      const tokenData = await apiService.getSpeechToken();
      res.json(tokenData);
    } catch (error) {
      console.error("Error getting speech token:", error);
      res.status(500).json({ error: "Failed to get speech token" });
    }
  },
};

export default apiController;
