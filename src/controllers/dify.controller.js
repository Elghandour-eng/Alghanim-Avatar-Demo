import difyService from "../services/dify.service.js";

const difyController = {
  async sendMessage(req, res) {
    try {
      const { message, userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      await difyService.sendMessage(message, userId, res);
    } catch (error) {
      console.error("Error in Dify chat:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to process chat message" });
      }
    }
  },
};

export default difyController;
