import { pgTable, serial, integer, real, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "active", "completed", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded", "failed"]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  totalPrice: real("total_price").notNull(),
  depositAmount: real("deposit_amount").notNull().default(0),
  status: bookingStatusEnum("status").notNull().default("pending"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
