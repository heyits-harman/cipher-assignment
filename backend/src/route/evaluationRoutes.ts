import { Router } from "express";
import { getEvaluation, retryEvaluation } from '../controllers/evaluationController';

const router = Router();

router.get("/:attemptId", getEvaluation);
router.post("/:attemptId/retry", retryEvaluation);

export default router;