import type { Request, Response } from "express";
import { prisma } from '../../lib/prisma'

export const listProblems = async (req: Request, res: Response) => {
  try{

    const problems = await prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        description: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({Success: true, problems});

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const getProblemBySlug = async (req: Request, res: Response) => {
  try{

    const { slug } = req.params;

    if (typeof slug !== "string") {
      return res.status(400).json({ error: "Invalid slug" });
    }

    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: { evaluationCriteria: true },
    });

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    return res.status(200).json({Success: true, problem});

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}