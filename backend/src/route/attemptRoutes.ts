import { Router } from "express";
import { createAttempt, getAttempt, submitAttempt, getAttemptHistory } from '../controllers/attemptController';

const router = Router();

router.post("/", createAttempt);
router.get("/:id", getAttempt);
router.post("/:id/submission", submitAttempt);
router.get("/history/:userId/:problemId", getAttemptHistory);

export default router;