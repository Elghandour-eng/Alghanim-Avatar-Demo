import { Router } from "express";
import difyController from "../controllers/dify.controller.js";

const difyRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Dify
 *   description: API for Dify chat services
 */

/**
 * @swagger
 * /api/dify-chat:
 *   post:
 *     summary: Send a message to Dify chat
 *     tags: [Dify]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - userId
 *             properties:
 *               message:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: A streaming response of chat messages
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: Bad request, missing message or userId
 *       500:
 *         description: Failed to process chat message
 */
difyRouter.post("/api/dify-chat", difyController.sendMessage);

export default difyRouter;
