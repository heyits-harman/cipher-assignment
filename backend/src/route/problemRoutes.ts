import { Router } from "express";
import { listProblems, getProblemBySlug } from '../controllers/problemController';

const router = Router();

router.get("/", listProblems);
router.get("/:slug", getProblemBySlug);

export default router;