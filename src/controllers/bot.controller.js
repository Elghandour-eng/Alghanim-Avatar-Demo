import botService from "../services/bot.service.js";

class BotController {
  async createBot(req, res) {
    try {
      const bot = await botService.createBot(req.body);
      res.status(201).json(bot);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getBots(req, res) {
    try {
      const bots = await botService.getBots();
      res.status(200).json(bots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBotById(req, res) {
    try {
      const bot = await botService.getBotById(req.params.id);
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      res.status(200).json(bot);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateBot(req, res) {
    try {
      const bot = await botService.updateBot(req.params.id, req.body);
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      res.status(200).json(bot);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteBot(req, res) {
    try {
      const bot = await botService.deleteBot(req.params.id);
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new BotController();
