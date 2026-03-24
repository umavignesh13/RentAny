import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, productsTable, usersTable } from "@workspace/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";

const router = Router();

const formatBooking = (b: typeof bookingsTable.$inferSelect, product?: any, user?: any) => ({
  id: b.id,
  userId: b.userId,
  productId: b.productId,
  startDate: b.startDate,
  endDate: b.endDate,
  totalDays: b.totalDays,
  totalPrice: b.totalPrice,
  depositAmount: b.depositAmount,
  status: b.status,
  paymentStatus: b.paymentStatus,
  createdAt: b.createdAt,
  ...(product ? { product } : {}),
  ...(user ? { user } : {}),
});

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { role, status } = req.query as { role?: string; status?: string };
    let whereClause;
    if (role === "owner") {
      const userProducts = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.ownerId, req.userId!));
      const productIds = userProducts.map((p) => p.id);
      if (productIds.length === 0) {
        res.json([]);
        return;
      }
      const { sql: sqlFn, inArray } = await import("drizzle-orm");
      whereClause = inArray(bookingsTable.productId, productIds);
    } else {
      whereClause = eq(bookingsTable.userId, req.userId!);
    }

    const bookings = await db.select().from(bookingsTable).where(whereClause).orderBy(desc(bookingsTable.createdAt));

    const result = await Promise.all(bookings.map(async (b) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, b.productId)).limit(1);
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, b.userId)).limit(1);
      const productData = product ? {
        id: product.id, title: product.title, description: product.description,
        category: product.category, pricePerDay: product.pricePerDay, deposit: product.deposit,
        location: product.location, images: product.images, ownerId: product.ownerId,
        ownerName: "", ownerAvatar: null, rating: 0, reviewCount: 0,
        isAvailable: product.isAvailable, createdAt: product.createdAt,
      } : null;
      const userData = user ? {
        id: user.id, name: user.name, email: user.email, role: user.role,
        avatar: user.avatar, bio: user.bio, location: user.location,
        phone: user.phone, rating: user.rating, trustScore: user.trustScore,
        isBlocked: user.isBlocked, createdAt: user.createdAt,
      } : null;
      return formatBooking(b, productData, userData);
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get bookings error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { productId, startDate, endDate } = req.body;
    if (!productId || !startDate || !endDate) {
      res.status(400).json({ message: "productId, startDate, and endDate are required" });
      return;
    }
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (!product.isAvailable) {
      res.status(400).json({ message: "Product is not available" });
      return;
    }
    if (product.ownerId === req.userId) {
      res.status(400).json({ message: "You cannot book your own product" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) {
      res.status(400).json({ message: "Invalid date range" });
      return;
    }
    const totalPrice = totalDays * product.pricePerDay;

    const [booking] = await db.insert(bookingsTable).values({
      userId: req.userId!,
      productId,
      startDate,
      endDate,
      totalDays,
      totalPrice,
      depositAmount: product.deposit,
      status: "pending",
      paymentStatus: "pending",
    }).returning();

    await db.update(productsTable).set({ bookingCount: product.bookingCount + 1 }).where(eq(productsTable.id, productId));

    res.status(201).json(formatBooking(booking!));
  } catch (err) {
    req.log.error({ err }, "Create booking error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, booking.productId)).limit(1);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId)).limit(1);
    const productData = product ? {
      id: product.id, title: product.title, description: product.description,
      category: product.category, pricePerDay: product.pricePerDay, deposit: product.deposit,
      location: product.location, images: product.images, ownerId: product.ownerId,
      ownerName: "", ownerAvatar: null, rating: 0, reviewCount: 0,
      isAvailable: product.isAvailable, createdAt: product.createdAt,
    } : null;
    const userData = user ? {
      id: user.id, name: user.name, email: user.email, role: user.role,
      avatar: user.avatar, bio: user.bio, location: user.location,
      phone: user.phone, rating: user.rating, trustScore: user.trustScore,
      isBlocked: user.isBlocked, createdAt: user.createdAt,
    } : null;
    res.json(formatBooking(booking, productData, userData));
  } catch (err) {
    req.log.error({ err }, "Get booking error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ message: "Status is required" });
      return;
    }
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, booking.productId)).limit(1);
    const isOwner = product?.ownerId === req.userId;
    const isRenter = booking.userId === req.userId;
    if (!isOwner && !isRenter && req.userRole !== "admin") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const [updated] = await db.update(bookingsTable).set({ status, updatedAt: new Date() }).where(eq(bookingsTable.id, id)).returning();
    res.json(formatBooking(updated!));
  } catch (err) {
    req.log.error({ err }, "Update booking error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
