import { Router } from "express";
import botController from "../controllers/bot.controller.js";

const botRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Bot:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the bot
 *         name:
 *           type: string
 *           description: The name of the bot
 *         description:
 *           type: string
 *           description: The description of the bot
 *       example:
 *         id: d5fE_asz
 *         name: "Sales Bot"
 *         description: "A bot to help with sales inquiries"
 */

/**
 * @swagger
 * tags:
 *   name: Bots
 *   description: The bots managing API
 */

/**
 * @swagger
 * /api/bots:
 *   post:
 *     summary: Create a new bot
 *     tags: [Bots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bot'
 *     responses:
 *       201:
 *         description: The bot was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bot'
 *       500:
 *         description: Some server error
 */
botRouter.post("/", botController.createBot);

/**
 * @swagger
 * /api/bots:
 *   get:
 *     summary: Returns the list of all the bots
 *     tags: [Bots]
 *     responses:
 *       200:
 *         description: The list of the bots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bot'
 */
botRouter.get("/", botController.getBots);

/**
 * @swagger
 * /api/bots/{id}:
 *   get:
 *     summary: Get the bot by id
 *     tags: [Bots]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The bot id
 *     responses:
 *       200:
 *         description: The bot description by id
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bot'
 *       404:
 *         description: The bot was not found
 */
botRouter.get("/:id", botController.getBotById);

/**
 * @swagger
 * /api/bots/{id}:
 *  put:
 *    summary: Update the bot by the id
 *    tags: [Bots]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The bot id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Bot'
 *    responses:
 *      200:
 *        description: The bot was updated
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Bot'
 *      404:
 *        description: The bot was not found
 *      500:
 *        description: Some error happened
 */
botRouter.put("/:id", botController.updateBot);

/**
 * @swagger
 * /api/bots/{id}:
 *   delete:
 *     summary: Remove the bot by id
 *     tags: [Bots]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The bot id
 *
 *     responses:
 *       200:
 *         description: The bot was deleted
 *       404:
 *         description: The bot was not found
 */
botRouter.delete("/:id", botController.deleteBot);

export default botRouter;
