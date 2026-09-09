// import type { Request, Response } from "express";
// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import { prisma } from '../../lib/prisma'
// import { Role } from "../../generated/prisma/enums";

// export const createUser = async (req: Request, res: Response) => {
//   try {
//     const body = (req.body ?? {}) as {
//       name: string;
//       email: string;
//       password: string;
//       role: Role;
//     }

//     const { name, email, password } = body;
//     let role = body.role ?? Role.MEMBER;

//     if (!name || !email || !password) {
//       return res.status(400).json({ error: "INVALID_REQUEST" });
//     }

//     const existingUser = await prisma.user.findUnique({
//       where: { email },
//       select: { id: true },
//     });

//     if (existingUser !== null) {
//       return res.status(400).json({ error: "Email already exists!" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await prisma.user.create({
//       data: { name, email, password: hashedPassword, role },
//     });

//     return res.status(201).json({ message: "User Created", user: newUser });
//   } catch (err: any) {
//     console.error("Registration Error: ", err.message);
//     return res.status(500).json({ error: "Server error during registration" });
//   }
// }

// export const loginUser = async (req: Request, res: Response) => {
//   try {
//     const body = (req.body ?? {}) as { email: string; password: string; }

//     const { email, password } = body;

//     const user = await prisma.user.findUnique({
//       where: { email },
//       select: { id: true, role: true, password: true },
//     });

//     if (!user) {
//       return res.status(400).json({ error: "User is not registered!" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ error: "Invalid password!" });
//     }

//     const token = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN!, { expiresIn: "1d" });
//     return res.json({ message: 'Login Succesfully', token });
//   } catch (err: any) {
//     console.error("Login Error: ", err.message);
//     return res.status(500).json({ error: "Server error during login" });
//   }
// }

// // Fetch all users — used by admin to assign leads by name
// export const getUsers = async (req: Request, res: Response) => {
//   try {
//     const users = await prisma.user.findMany({
//       select: { id: true, name: true, email: true, role: true },
//       orderBy: { name: 'asc' },
//     });

//     return res.status(200).json({ success: true, users });
//   } catch (err: any) {
//     console.error("Get Users Error: ", err.message);
//     return res.status(500).json({ error: "Failed to fetch users" });
//   }
// }