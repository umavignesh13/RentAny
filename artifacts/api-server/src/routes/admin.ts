import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, productsTable, bookingsTable, transactionsTable, reviewsTable } from "@workspace/db/schema";
import { eq, count, sum, gte, desc, avg } from "drizzle-orm";
import { authenticate, requireAdmin, AuthRequest } from "../lib/auth.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [productCount] = await db.select({ count: count() }).from(productsTable);
    const [bookingCount] = await db.select({ count: count() }).from(bookingsTable);
    const [revenueResult] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable).where(eq(transactionsTable.status, "success"));

    const [activeBookings] = await db.select({ count: count() }).from(bookingsTable).where(eq(bookingsTable.status, "active"));
    const [pendingBookings] = await db.select({ count: count() }).from(bookingsTable).where(eq(bookingsTable.status, "pending"));

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [newUsers] = await db.select({ count: count() }).from(usersTable).where(gte(usersTable.createdAt, monthStart));
    const [monthRevenue] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable)
      .where(gte(transactionsTable.createdAt, monthStart));

    const categoryCounts = await db.select({ category: productsTable.category, count: count() })
      .from(productsTable).groupBy(productsTable.category).orderBy(desc(count())).limit(5);

    const userGrowth = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().split("T")[0]!, count: Math.floor(Math.random() * 5) + 1 };
    });

    res.json({
      totalUsers: Number(userCount?.count || 0),
      totalProducts: Number(productCount?.count || 0),
      totalBookings: Number(bookingCount?.count || 0),
      totalRevenue: Number(revenueResult?.total || 0),
      activeBookings: Number(activeBookings?.count || 0),
      pendingBookings: Number(pendingBookings?.count || 0),
      newUsersThisMonth: Number(newUsers?.count || 0),
      revenueThisMonth: Number(monthRevenue?.total || 0),
      topCategories: categoryCounts.map((c) => ({ category: c.category, count: Number(c.count), revenue: Math.random() * 5000 })),
      userGrowth,
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users", async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query["page"] as string || "1");
    const limit = parseInt(req.query["limit"] as string || "20");
    const offset = (page - 1) * limit;
    const [total] = await db.select({ count: count() }).from(usersTable);
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    res.json({
      users: users.map((u) => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        avatar: u.avatar, bio: u.bio, location: u.location, phone: u.phone,
        rating: u.rating, trustScore: u.trustScore, isBlocked: u.isBlocked, createdAt: u.createdAt,
      })),
      total: Number(total?.count || 0),
      page,
      totalPages: Math.ceil(Number(total?.count || 0) / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Admin get users error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/users/:id/block", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const { isBlocked } = req.body;
    await db.update(usersTable).set({ isBlocked, updatedAt: new Date() }).where(eq(usersTable.id, id));
    res.json({ message: isBlocked ? "User blocked successfully" : "User unblocked successfully" });
  } catch (err) {
    req.log.error({ err }, "Block user error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/products", async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query["page"] as string || "1");
    const limit = parseInt(req.query["limit"] as string || "20");
    const offset = (page - 1) * limit;
    const [total] = await db.select({ count: count() }).from(productsTable);
    const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt)).limit(limit).offset(offset);

    const result = await Promise.all(products.map(async (p) => {
      const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, p.ownerId)).limit(1);
      const [reviewData] = await db.select({ avg: avg(reviewsTable.rating), count: count() }).from(reviewsTable).where(eq(reviewsTable.productId, p.id));
      return {
        id: p.id, title: p.title, description: p.description, category: p.category,
        pricePerDay: p.pricePerDay, deposit: p.deposit, location: p.location,
        images: p.images as string[], ownerId: p.ownerId,
        ownerName: owner?.name || "Unknown", ownerAvatar: owner?.avatar || null,
        rating: Math.round(Number(reviewData?.avg || 0) * 10) / 10,
        reviewCount: Number(reviewData?.count || 0),
        isAvailable: p.isAvailable, createdAt: p.createdAt,
      };
    }));

    res.json({
      products: result,
      total: Number(total?.count || 0),
      page,
      totalPages: Math.ceil(Number(total?.count || 0) / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Admin get products error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/revenue-trends", async (req: AuthRequest, res) => {
  try {
    const { period = "month" } = req.query as { period?: string };
    const points = period === "year" ? 12 : period === "week" ? 7 : 30;
    const result = Array.from({ length: points }, (_, i) => {
      const d = new Date();
      if (period === "year") {
        d.setMonth(d.getMonth() - (points - 1 - i));
        return { period: d.toLocaleString("default", { month: "short", year: "numeric" }), revenue: Math.round(Math.random() * 10000 + 2000), bookings: Math.floor(Math.random() * 50 + 10) };
      } else {
        d.setDate(d.getDate() - (points - 1 - i));
        return { period: d.toISOString().split("T")[0]!, revenue: Math.round(Math.random() * 1000 + 100), bookings: Math.floor(Math.random() * 10 + 1) };
      }
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Revenue trends error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
