import type { Request, Response } from "express";
import { prisma } from '../../lib/prisma'

export const getEvaluation = async (req: Request, res: Response) => {
  try{

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const retryEvaluation = async (req: Request, res: Response) => {
  try{

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}