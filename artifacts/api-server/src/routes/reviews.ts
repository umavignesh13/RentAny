import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable, productsTable, bookingsTable } from "@workspace/db/schema";
import { eq, avg, desc } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/product/:productId", async (req, res) => {
  try {
    const productId = parseInt(req.params["productId"]!);
    const reviews = await db
      .select({
        id: reviewsTable.id,
        userId: reviewsTable.userId,
        productId: reviewsTable.productId,
        bookingId: reviewsTable.bookingId,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        userName: usersTable.name,
        userAvatar: usersTable.avatar,
      })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .where(eq(reviewsTable.productId, productId))
      .orderBy(desc(reviewsTable.createdAt));

    res.json(reviews.map((r) => ({ ...r, userName: r.userName || "Unknown", userAvatar: r.userAvatar || null })));
  } catch (err) {
    req.log.error({ err }, "Get reviews error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { productId, bookingId, rating, comment } = req.body;
    if (!productId || !bookingId || !rating || !comment) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    const [review] = await db.insert(reviewsTable).values({
      userId: req.userId!,
      productId,
      bookingId,
      rating,
      comment,
    }).returning();

    const [avgResult] = await db.select({ avg: avg(reviewsTable.rating) }).from(reviewsTable).where(eq(reviewsTable.productId, productId));
    const newRating = Math.round((Number(avgResult?.avg || 0)) * 10) / 10;
    await db.update(productsTable).set({ updatedAt: new Date() }).where(eq(productsTable.id, productId));

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    res.status(201).json({ ...review, userName: user?.name || "Unknown", userAvatar: user?.avatar || null });
  } catch (err) {
    req.log.error({ err }, "Create review error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
