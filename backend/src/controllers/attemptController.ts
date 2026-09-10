import type { Request, Response } from "express";
import { prisma } from '../../lib/prisma'
import { runEvaluation } from '../services/evaluation'

export const createAttempt = async (req: Request, res: Response) => {
  try{

    const { userId, problemId } = req.body;

    if (!userId || !problemId) {
      return res.status(400).json({ error: "userId and problemId are required" });
    }

    const problem = await prisma.problem.findUnique({ where: { id: problemId } });

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const attempt = await prisma.practiceAttempt.create({
      data: { userId, problemId },
    });

    return res.status(201).json({ Success: true, attempt });

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const getAttempt = async (req: Request, res: Response) => {
  try{

    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const attempt = await prisma.practiceAttempt.findUnique({
      where: { id },
      include: { submission: true, evaluation: true, problem: true },
    });

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    return res.status(201).json({ Success: true, attempt });

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const submitAttempt = async (req: Request, res: Response) => {
  try{

    const { id } = req.params;
    const { content } = req.body;

    if (typeof id !== "string" || !content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Invalid ID or Content" });
    }

    const attempt = await prisma.practiceAttempt.findUnique({ where: { id } });
    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    if (attempt.status !== "DRAFT") {
      return res.status(400).json({ error: "This attempt has already been submitted" });
    }

    await prisma.submission.create({
      data: { 
        attemptId: id, 
        content: content
      }
    });

    // Awaited for now since text-based checks are fast.
    await runEvaluation(id);

    const result = await prisma.practiceAttempt.findUnique({
      where: { id },
      include: { submission: true, evaluation: true },
    });

    return res.status(201).json({ Success: true, result })

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const getAttemptHistory = async (req: Request, res: Response) => {
  try{

    const { userId, problemId } = req.params;

    if (typeof userId !== "string" || !userId || typeof problemId !== "string" || !problemId) {
      return res.status(400).json({ error: "Invalid user or problem ID" });
    }

    const attempts = await prisma.practiceAttempt.findMany({
      where: { userId, problemId },
      include: { evaluation: true },
      orderBy: { startedAt: "desc" },
    });

    return res.status(200).json(attempts);

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}