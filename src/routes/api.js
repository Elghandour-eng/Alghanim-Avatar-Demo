import { Router } from "express";
import apiController from "../controllers/api.controller.js";

const apiRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Azure Speech
 *   description: API for Azure Speech services
 */

/**
 * @swagger
 * /api/speech-config:
 *   get:
 *     summary: Get Azure Speech configuration
 *     tags: [Azure Speech]
 *     responses:
 *       200:
 *         description: The Azure Speech configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 region:
 *                   type: string
 *                 success:
 *                   type: boolean
 *       500:
 *         description: Failed to get speech configuration
 */
apiRouter.get("/speech-config", apiController.getSpeechConfig);

/**
 * @swagger
 * /api/speech-token:
 *   post:
 *     summary: Get Azure Speech token
 *     tags: [Azure Speech]
 *     responses:
 *       200:
 *         description: The Azure Speech token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 region:
 *                   type: string
 *       500:
 *         description: Failed to get speech token
 */
apiRouter.post("/speech-token", apiController.getSpeechToken);

export default apiRouter;
