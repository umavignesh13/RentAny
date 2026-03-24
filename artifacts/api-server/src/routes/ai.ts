import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, usersTable, bookingsTable, reviewsTable } from "@workspace/db/schema";
import { eq, desc, count, avg, ne, gte, inArray } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/recommendations", authenticate, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query["limit"] as string || "8");

    const userBookings = await db.select({ productId: bookingsTable.productId })
      .from(bookingsTable)
      .where(eq(bookingsTable.userId, req.userId!));

    const bookedProductIds = userBookings.map((b) => b.productId);

    const bookedProducts = bookedProductIds.length > 0
      ? await db.select({ category: productsTable.category }).from(productsTable)
          .where(eq(productsTable.id, bookedProductIds[0]!))
      : [];
    const preferredCategories = [...new Set(bookedProducts.map((p) => p.category))];

    let recommended = await db.select().from(productsTable)
      .where(eq(productsTable.isAvailable, true))
      .orderBy(desc(productsTable.bookingCount))
      .limit(limit * 2);

    if (preferredCategories.length > 0) {
      const categoryBased = recommended.filter((p) => preferredCategories.includes(p.category));
      const others = recommended.filter((p) => !preferredCategories.includes(p.category));
      recommended = [...categoryBased, ...others].slice(0, limit);
    } else {
      recommended = recommended.slice(0, limit);
    }

    const ownerIds = [...new Set(recommended.map((p) => p.ownerId))];
    const owners = ownerIds.length > 0
      ? await db.select().from(usersTable).where(inArray(usersTable.id, ownerIds))
      : [];
    const ownerMap = Object.fromEntries(owners.map((o) => [o.id, o]));

    const result = await Promise.all(recommended.map(async (p) => {
      const [reviewData] = await db.select({ avg: avg(reviewsTable.rating), count: count() }).from(reviewsTable).where(eq(reviewsTable.productId, p.id));
      const owner = ownerMap[p.ownerId];
      return {
        id: p.id, title: p.title, description: p.description,
        category: p.category, pricePerDay: p.pricePerDay, deposit: p.deposit,
        location: p.location, images: p.images as string[],
        ownerId: p.ownerId, ownerName: owner?.name || "Unknown", ownerAvatar: owner?.avatar || null,
        rating: Math.round(Number(reviewData?.avg || 0) * 10) / 10,
        reviewCount: Number(reviewData?.count || 0),
        isAvailable: p.isAvailable, createdAt: p.createdAt,
      };
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Recommendations error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/price-prediction", authenticate, async (req: AuthRequest, res) => {
  try {
    const { category, location, condition = "good", description = "" } = req.body;

    const similar = await db.select({ price: productsTable.pricePerDay })
      .from(productsTable)
      .where(eq(productsTable.category, category))
      .limit(20);

    let basePrice = 25;
    if (similar.length > 0) {
      basePrice = similar.reduce((s, p) => s + p.pricePerDay, 0) / similar.length;
    }

    const conditionMultipliers: Record<string, number> = {
      new: 1.3, like_new: 1.15, good: 1.0, fair: 0.75,
    };
    const multiplier = conditionMultipliers[condition] || 1.0;
    const suggestedPrice = Math.round(basePrice * multiplier * 100) / 100;

    const categoryPremiums: Record<string, number> = {
      vehicles: 1.5, electronics: 1.3, cameras: 1.25, music: 1.2,
      sports: 1.1, tools: 1.0, furniture: 0.9, books: 0.7, games: 0.8, fashion: 0.9,
    };
    const catMultiplier = categoryPremiums[category] || 1.0;
    const adjusted = Math.round(suggestedPrice * catMultiplier * 100) / 100;

    res.json({
      suggestedPrice: adjusted,
      minPrice: Math.round(adjusted * 0.7 * 100) / 100,
      maxPrice: Math.round(adjusted * 1.4 * 100) / 100,
      confidence: similar.length > 5 ? 0.85 : similar.length > 0 ? 0.65 : 0.40,
      reasoning: similar.length > 0
        ? `Based on ${similar.length} similar ${category} listings in the market with an average price of $${Math.round(basePrice * 100) / 100}/day. Adjusted for item condition (${condition}) and category demand.`
        : `No similar listings found. Estimated based on category (${category}) and general market rates.`,
    });
  } catch (err) {
    req.log.error({ err }, "Price prediction error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/fraud-score/:userId", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params["userId"]!);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const flags: string[] = [];
    let score = 100;

    const cancelledBookings = await db.select({ count: count() })
      .from(bookingsTable)
      .where(eq(bookingsTable.userId, userId));
    const totalBookings = Number(cancelledBookings[0]?.count || 0);

    const reviews = await db.select({ rating: reviewsTable.rating })
      .from(reviewsTable)
      .where(eq(reviewsTable.userId, userId));
    const avgUserRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 5;

    if (totalBookings === 0 && (new Date().getTime() - new Date(user.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000) {
      score -= 10;
      flags.push("New account with no booking history");
    }
    if (avgUserRating < 2.5 && reviews.length > 2) {
      score -= 25;
      flags.push("Consistently low ratings from peers");
    }
    if (user.isBlocked) {
      score = 0;
      flags.push("Account has been blocked by admin");
    }
    score = Math.max(0, Math.min(100, score));

    let riskLevel: "low" | "medium" | "high" = "low";
    if (score < 40) riskLevel = "high";
    else if (score < 70) riskLevel = "medium";

    res.json({ userId, score, riskLevel, flags });
  } catch (err) {
    req.log.error({ err }, "Fraud score error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/popular-products", async (req, res) => {
  try {
    const limit = parseInt(req.query["limit"] as string || "6");
    const products = await db.select().from(productsTable)
      .where(eq(productsTable.isAvailable, true))
      .orderBy(desc(productsTable.bookingCount))
      .limit(limit);

    const ownerIds = [...new Set(products.map((p) => p.ownerId))];
    const owners = await Promise.all(ownerIds.map((id) => db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1)));
    const ownerMap = Object.fromEntries(owners.flat().map((o) => [o.id, o]));

    const result = await Promise.all(products.map(async (p) => {
      const [reviewData] = await db.select({ avg: avg(reviewsTable.rating), count: count() }).from(reviewsTable).where(eq(reviewsTable.productId, p.id));
      const owner = ownerMap[p.ownerId];
      return {
        id: p.id, title: p.title, description: p.description,
        category: p.category, pricePerDay: p.pricePerDay, deposit: p.deposit,
        location: p.location, images: p.images as string[],
        ownerId: p.ownerId, ownerName: owner?.name || "Unknown", ownerAvatar: owner?.avatar || null,
        rating: Math.round(Number(reviewData?.avg || 0) * 10) / 10,
        reviewCount: Number(reviewData?.count || 0),
        isAvailable: p.isAvailable, createdAt: p.createdAt,
      };
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Popular products error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
