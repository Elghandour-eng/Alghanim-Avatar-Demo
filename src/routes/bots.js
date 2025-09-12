import { Router } from "express";
import botController from "../controllers/bot.controller.js";

const botRouter = Router();

botRouter.post("/", botController.createBot);
botRouter.get("/", botController.getBots);
botRouter.get("/:id", botController.getBotById);
botRouter.put("/:id", botController.updateBot);
botRouter.delete("/:id", botController.deleteBot);

export default botRouter;
