import { Router } from "express";
import labelController from "../controllers/label.controller.js";

const router = Router();

router.get("/", labelController.getAllLabels);
router.get("/:id", labelController.getLabelById);
router.post("/", labelController.createLabel);
router.put("/:id", labelController.updateLabel);
router.delete("/:id", labelController.deleteLabel);

export default router;
