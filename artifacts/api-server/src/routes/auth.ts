import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken, authenticate, AuthRequest } from "../lib/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email, and password are required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash,
      role: role === "owner" ? "owner" : "user",
    }).returning();
    if (!user) {
      res.status(500).json({ message: "Failed to create user" });
      return;
    }
    const token = generateToken(user.id, user.role);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        phone: user.phone,
        rating: user.rating,
        trustScore: user.trustScore,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ message: "Account is blocked" });
      return;
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id, user.role);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        phone: user.phone,
        rating: user.rating,
        trustScore: user.trustScore,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      phone: user.phone,
      rating: user.rating,
      trustScore: user.trustScore,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
