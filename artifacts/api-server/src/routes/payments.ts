import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, bookingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";
import { randomUUID } from "crypto";

const router = Router();

router.post("/create-intent", authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookingId, amount } = req.body;
    if (!bookingId || !amount) {
      res.status(400).json({ message: "bookingId and amount are required" });
      return;
    }
    const clientSecret = `pi_${randomUUID().replace(/-/g, "")}_secret_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    res.json({
      clientSecret,
      amount: parseFloat(amount),
      currency: "usd",
    });
  } catch (err) {
    req.log.error({ err }, "Create payment intent error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/confirm", authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;
    if (!bookingId || !paymentIntentId) {
      res.status(400).json({ message: "bookingId and paymentIntentId are required" });
      return;
    }
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    const [transaction] = await db.insert(transactionsTable).values({
      bookingId,
      userId: req.userId!,
      amount: booking.totalPrice + booking.depositAmount,
      status: "success",
      paymentMethod: "stripe",
      transactionRef: paymentIntentId,
    }).returning();

    await db.update(bookingsTable).set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() }).where(eq(bookingsTable.id, bookingId));

    res.json(transaction);
  } catch (err) {
    req.log.error({ err }, "Confirm payment error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/history", authenticate, async (req: AuthRequest, res) => {
  try {
    const transactions = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, req.userId!)).orderBy(transactionsTable.createdAt);
    res.json(transactions);
  } catch (err) {
    req.log.error({ err }, "Get transactions error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
