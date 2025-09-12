import { Router } from "express";
import heygenController from "../controllers/heygen.controller.js";

const heygenRouter = Router();

/**
 * @swagger
 * tags:
 *   name: HeyGen
 *   description: API for HeyGen services
 */

/**
 * @swagger
 * /api/heygen-voices:
 *   get:
 *     summary: Get HeyGen voices
 *     tags: [HeyGen]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: The language of the voices
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: The gender of the voices
 *     responses:
 *       200:
 *         description: A list of voices
 *       500:
 *         description: Failed to fetch HeyGen voices
 */
heygenRouter.get("/api/heygen-voices", heygenController.getVoices);

/**
 * @swagger
 * /api/heygen-avatars:
 *   get:
 *     summary: Get HeyGen avatars
 *     tags: [HeyGen]
 *     parameters:
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: The gender of the avatars
 *     responses:
 *       200:
 *         description: A list of avatars
 *       500:
 *         description: Failed to fetch HeyGen avatars
 */
heygenRouter.get("/api/heygen-avatars", heygenController.getAvatars);

/**
 * @swagger
 * /api/heygen-config:
 *   get:
 *     summary: Get HeyGen configuration
 *     tags: [HeyGen]
 *     responses:
 *       200:
 *         description: The HeyGen configuration
 *       500:
 *         description: Failed to get HeyGen configuration
 */
heygenRouter.get("/api/heygen-config", heygenController.getConfig);

/**
 * @swagger
 * /api/heygen-session:
 *   post:
 *     summary: Create a new HeyGen session
 *     tags: [HeyGen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatarId
 *               - voiceId
 *             properties:
 *               avatarId:
 *                 type: string
 *               voiceId:
 *                 type: string
 *               botId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created session
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to create HeyGen session
 */
heygenRouter.post("/api/heygen-session", heygenController.createSession);

/**
 * @swagger
 * /api/heygen-start:
 *   post:
 *     summary: Start a HeyGen session
 *     tags: [HeyGen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - sdp
 *             properties:
 *               sessionId:
 *                 type: string
 *               sdp:
 *                 type: object
 *     responses:
 *       200:
 *         description: Session started
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to start HeyGen session
 */
heygenRouter.post("/api/heygen-start", heygenController.startSession);

/**
 * @swagger
 * /api/heygen-ice:
 *   post:
 *     summary: Handle ICE candidates
 *     tags: [HeyGen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - candidate
 *             properties:
 *               sessionId:
 *                 type: string
 *               candidate:
 *                 type: object
 *     responses:
 *       200:
 *         description: ICE candidate handled
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to handle ICE candidate
 */
heygenRouter.post("/api/heygen-ice", heygenController.handleIce);

/**
 * @swagger
 * /api/heygen-speak:
 *   post:
 *     summary: Make avatar speak
 *     tags: [HeyGen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - text
 *             properties:
 *               sessionId:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Avatar speech task sent
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to make avatar speak
 */
heygenRouter.post("/api/heygen-speak", heygenController.speak);

/**
 * @swagger
 * /api/heygen-stop:
 *   post:
 *     summary: Stop a HeyGen session
 *     tags: [HeyGen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session stopped
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to stop HeyGen session
 */
heygenRouter.post("/api/heygen-stop", heygenController.stopSession);

export default heygenRouter;
