import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env["JWT_SECRET"] || "rentany_jwt_secret_key_2024";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; role: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
}

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token!);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== "admin") {
    res.status(403).json({ message: "Forbidden: Admin access required" });
    return;
  }
  next();
}
