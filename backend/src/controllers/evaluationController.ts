import type { Request, Response } from "express";
import { prisma } from '../../lib/prisma';
import { retryEvaluation as retryEvaluationService } from "../services/evaluation"

export const getEvaluation = async (req: Request, res: Response) => {
  try{

    const { attemptId } = req.params;

    if (typeof attemptId !== "string") {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { attemptId },
    });

    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found for this attempt" });
    }

    return res.status(200).json({ Success: true, evaluation })

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const retryEvaluation = async (req: Request, res: Response) => {
  try{

    const { attemptId } = req.params;

    if (typeof attemptId !== "string") {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const evaluation = await prisma.evaluation.findUnique({ where: { attemptId } });
    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found for this attempt" });
    }

    if (evaluation.status !== "FAILED") {
      return res.status(400).json({ error: "Only a failed evaluation can be retried" });
    }

    await retryEvaluationService(attemptId);

    const updated = await prisma.evaluation.findUnique({ where: { attemptId } });

    return res.status(201).json({ Success: true, updated })

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}