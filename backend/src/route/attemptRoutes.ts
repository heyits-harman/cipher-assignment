import { Router } from "express";
import { createAttempt, getAttempt, submitAttempt, getAttemptHistory } from '../controllers/attemptController';

const router = Router();

router.post("/", createAttempt); //starts a new attempt
router.get("/history/:userId/:problemId", getAttemptHistory); //the "try again" history view. Returns every past attempt a user made on that specific problem
router.get("/:id", getAttempt); //fetches one attempt with its submission and evaluation attached
router.post("/:id/submission", submitAttempt); //the actual submit action

export default router;