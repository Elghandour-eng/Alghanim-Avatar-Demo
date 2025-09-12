import { Router } from "express";
import heygenRouter from "./heygen.js";
import difyRouter from "./dify.js";
import apiRouter from "./api.js";
import labelRouter from "./labels.js";
import botRouter from "./bots.js";

const router = Router();

router.use(heygenRouter);
router.use(difyRouter);
router.use(apiRouter);
router.use("/labels", labelRouter);
router.use("/bots", botRouter);

export default router;
