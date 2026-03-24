import { pgTable, serial, integer, real, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { bookingsTable } from "./bookings";

export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "success", "failed", "refunded"]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookingsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  paymentMethod: text("payment_method").default("stripe"),
  transactionRef: text("transaction_ref").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
