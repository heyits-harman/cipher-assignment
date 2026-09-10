import { Router } from "express";
import { listProblems, getProblemBySlug } from '../controllers/problemController';

const router = Router();

router.get("/", listProblems); //returns the list of problems for the picker screen
router.get("/:slug", getProblemBySlug); //returns one problem's full detail: requirements, criteria

export default router;