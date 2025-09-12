import { Router } from "express";
import labelController from "../controllers/label.controller.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Label:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the label
 *         name:
 *           type: string
 *           description: The name of the label
 *         description:
 *           type: string
 *           description: The description of the label
 *         color:
 *           type: string
 *           description: The color of the label
 *       example:
 *         name: "Inquiry"
 *         description: "A customer inquiry"
 *         color: "#ff0000"
 */

/**
 * @swagger
 * tags:
 *   name: Labels
 *   description: The labels managing API
 */

/**
 * @swagger
 * /api/labels:
 *   get:
 *     summary: Returns the list of all the labels
 *     tags: [Labels]
 *     responses:
 *       200:
 *         description: The list of the labels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Label'
 */
router.get("/", labelController.getAllLabels);

/**
 * @swagger
 * /api/labels/{id}:
 *   get:
 *     summary: Get the label by id
 *     tags: [Labels]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The label id
 *     responses:
 *       200:
 *         description: The label description by id
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Label'
 *       404:
 *         description: The label was not found
 */
router.get("/:id", labelController.getLabelById);

/**
 * @swagger
 * /api/labels:
 *   post:
 *     summary: Create a new label
 *     tags: [Labels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Label'
 *     responses:
 *       201:
 *         description: The label was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Label'
 *       500:
 *         description: Some server error
 */
router.post("/", labelController.createLabel);

/**
 * @swagger
 * /api/labels/{id}:
 *  put:
 *    summary: Update the label by the id
 *    tags: [Labels]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The label id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Label'
 *    responses:
 *      200:
 *        description: The label was updated
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Label'
 *      404:
 *        description: The label was not found
 *      500:
 *        description: Some error happened
 */
router.put("/:id", labelController.updateLabel);

/**
 * @swagger
 * /api/labels/{id}:
 *   delete:
 *     summary: Remove the label by id
 *     tags: [Labels]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The label id
 *
 *     responses:
 *       200:
 *         description: The label was deleted
 *       404:
 *         description: The label was not found
 */
router.delete("/:id", labelController.deleteLabel);

export default router;
