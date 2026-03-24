import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, usersTable, reviewsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, ilike, desc, asc, sql, count, avg, inArray } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";

const router = Router();

const CATEGORIES = [
  { id: "electronics", name: "Electronics", icon: "Laptop", count: 0 },
  { id: "vehicles", name: "Vehicles", icon: "Car", count: 0 },
  { id: "sports", name: "Sports & Outdoor", icon: "Dumbbell", count: 0 },
  { id: "tools", name: "Tools & Equipment", icon: "Wrench", count: 0 },
  { id: "fashion", name: "Fashion", icon: "Shirt", count: 0 },
  { id: "furniture", name: "Furniture", icon: "Sofa", count: 0 },
  { id: "music", name: "Musical Instruments", icon: "Music", count: 0 },
  { id: "cameras", name: "Cameras & Photography", icon: "Camera", count: 0 },
  { id: "games", name: "Games & Toys", icon: "Gamepad2", count: 0 },
  { id: "books", name: "Books & Media", icon: "BookOpen", count: 0 },
];

const formatProduct = (p: typeof productsTable.$inferSelect, owner?: typeof usersTable.$inferSelect, rating = 0, reviewCount = 0) => ({
  id: p.id,
  title: p.title,
  description: p.description,
  category: p.category,
  pricePerDay: p.pricePerDay,
  deposit: p.deposit,
  location: p.location,
  images: p.images as string[],
  ownerId: p.ownerId,
  ownerName: owner?.name || "Unknown",
  ownerAvatar: owner?.avatar || null,
  rating: Math.round(rating * 10) / 10,
  reviewCount,
  isAvailable: p.isAvailable,
  createdAt: p.createdAt,
});

router.get("/categories", async (req, res) => {
  try {
    const categoryCounts = await db
      .select({ category: productsTable.category, count: count() })
      .from(productsTable)
      .where(eq(productsTable.isAvailable, true))
      .groupBy(productsTable.category);

    const countMap: Record<string, number> = {};
    categoryCounts.forEach((r) => {
      countMap[r.category] = Number(r.count);
    });

    const result = CATEGORIES.map((cat) => ({
      ...cat,
      count: countMap[cat.id] || 0,
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get categories error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/owner/:ownerId", async (req, res) => {
  try {
    const ownerId = parseInt(req.params["ownerId"]!);
    const products = await db.select().from(productsTable).where(eq(productsTable.ownerId, ownerId)).orderBy(desc(productsTable.createdAt));
    const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, ownerId)).limit(1);

    const result = await Promise.all(products.map(async (p) => {
      const [reviewData] = await db
        .select({ avg: avg(reviewsTable.rating), count: count() })
        .from(reviewsTable)
        .where(eq(reviewsTable.productId, p.id));
      return formatProduct(p, owner, Number(reviewData?.avg || 0), Number(reviewData?.count || 0));
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get owner products error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { category, location, minPrice, maxPrice, search, page = "1", limit = "12", sortBy } = req.query as Record<string, string>;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 12, 50);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (category) conditions.push(eq(productsTable.category, category));
    if (location) conditions.push(ilike(productsTable.location, `%${location}%`));
    if (minPrice) conditions.push(gte(productsTable.pricePerDay, parseFloat(minPrice)));
    if (maxPrice) conditions.push(lte(productsTable.pricePerDay, parseFloat(maxPrice)));
    if (search) conditions.push(ilike(productsTable.title, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    switch (sortBy) {
      case "price_asc": orderBy = asc(productsTable.pricePerDay); break;
      case "price_desc": orderBy = desc(productsTable.pricePerDay); break;
      case "popular": orderBy = desc(productsTable.bookingCount); break;
      default: orderBy = desc(productsTable.createdAt);
    }

    const [products, [totalResult]] = await Promise.all([
      db.select().from(productsTable).where(whereClause).orderBy(orderBy).limit(limitNum).offset(offset),
      db.select({ count: count() }).from(productsTable).where(whereClause),
    ]);

    const total = Number(totalResult?.count || 0);

    const ownerIds = [...new Set(products.map((p) => p.ownerId))];
    const owners = ownerIds.length > 0
      ? await db.select().from(usersTable).where(inArray(usersTable.id, ownerIds))
      : [];
    const ownerMap = Object.fromEntries(owners.map((o) => [o.id, o]));

    const result = await Promise.all(products.map(async (p) => {
      const [reviewData] = await db
        .select({ avg: avg(reviewsTable.rating), count: count() })
        .from(reviewsTable)
        .where(eq(reviewsTable.productId, p.id));
      return formatProduct(p, ownerMap[p.ownerId], Number(reviewData?.avg || 0), Number(reviewData?.count || 0));
    }));

    res.json({
      products: result,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error({ err }, "Get products error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    await db.update(productsTable).set({ viewCount: product.viewCount + 1 }).where(eq(productsTable.id, id));

    const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, product.ownerId)).limit(1);
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
      .where(eq(reviewsTable.productId, id))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(10);

    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    res.json({
      ...formatProduct(product, owner, avgRating, reviews.length),
      owner: owner ? {
        id: owner.id, name: owner.name, email: owner.email, role: owner.role,
        avatar: owner.avatar, bio: owner.bio, location: owner.location,
        phone: owner.phone, rating: owner.rating, trustScore: owner.trustScore,
        isBlocked: owner.isBlocked, createdAt: owner.createdAt,
      } : null,
      reviews: reviews.map((r) => ({ ...r, userName: r.userName || "Unknown", userAvatar: r.userAvatar || null })),
      unavailableDates: [],
    });
  } catch (err) {
    req.log.error({ err }, "Get product error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, category, pricePerDay, deposit = 0, location, images = [] } = req.body;
    if (!title || !description || !category || !pricePerDay || !location) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    const [product] = await db.insert(productsTable).values({
      title,
      description,
      category,
      pricePerDay: parseFloat(pricePerDay),
      deposit: parseFloat(deposit),
      location,
      images,
      ownerId: req.userId!,
    }).returning();
    if (!product) {
      res.status(500).json({ message: "Failed to create product" });
      return;
    }
    const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    res.status(201).json(formatProduct(product, owner, 0, 0));
  } catch (err) {
    req.log.error({ err }, "Create product error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (existing.ownerId !== req.userId && req.userRole !== "admin") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const { title, description, category, pricePerDay, deposit, location, images, isAvailable } = req.body;
    const updateData: Partial<typeof productsTable.$inferInsert> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (pricePerDay !== undefined) updateData.pricePerDay = parseFloat(pricePerDay);
    if (deposit !== undefined) updateData.deposit = parseFloat(deposit);
    if (location !== undefined) updateData.location = location;
    if (images !== undefined) updateData.images = images;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const [updated] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
    const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, updated!.ownerId)).limit(1);
    const [reviewData] = await db.select({ avg: avg(reviewsTable.rating), count: count() }).from(reviewsTable).where(eq(reviewsTable.productId, id));
    res.json(formatProduct(updated!, owner, Number(reviewData?.avg || 0), Number(reviewData?.count || 0)));
  } catch (err) {
    req.log.error({ err }, "Update product error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (existing.ownerId !== req.userId && req.userRole !== "admin") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Delete product error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
