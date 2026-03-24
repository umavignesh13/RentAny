import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";

const router = Router();

const formatUser = (user: typeof usersTable.$inferSelect) => ({
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

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(formatUser(user));
  } catch (err) {
    req.log.error({ err }, "Get user error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    if (req.userId !== id && req.userRole !== "admin") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const { name, bio, location, phone, avatar } = req.body;
    const updateData: Partial<typeof usersTable.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    updateData.updatedAt = new Date();
    const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(formatUser(updated));
  } catch (err) {
    req.log.error({ err }, "Update user error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
