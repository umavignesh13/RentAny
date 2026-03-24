import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";
import { bookingsTable } from "./bookings";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  bookingId: integer("booking_id").notNull().references(() => bookingsTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
