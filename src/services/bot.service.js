import Bot from "../models/bot.js";

class BotService {
  async createBot(botData) {
    const bot = new Bot(botData);
    return await bot.save();
  }

  async getBots() {
    return await Bot.find();
  }

  async getBotById(id) {
    return await Bot.findById(id);
  }

  async updateBot(id, botData) {
    return await Bot.findByIdAndUpdate(id, botData, { new: true });
  }

  async deleteBot(id) {
    return await Bot.findByIdAndDelete(id);
  }
}

export default new BotService();
