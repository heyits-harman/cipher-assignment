import type { Request, Response } from "express";
import { prisma } from '../../lib/prisma'

export const createAttempt = async (req: Request, res: Response) => {
  try{

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const getAttempt = async (req: Request, res: Response) => {
  try{

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const submitAttempt = async (req: Request, res: Response) => {
  try{

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

export const getAttemptHistory = async (req: Request, res: Response) => {
  try{

  }catch(err: any){
    console.error("Error: ", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}