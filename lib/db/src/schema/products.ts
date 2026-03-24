import { pgTable, serial, text, real, boolean, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  pricePerDay: real("price_per_day").notNull(),
  deposit: real("deposit").notNull().default(0),
  location: text("location").notNull(),
  images: json("images").$type<string[]>().notNull().default([]),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  isAvailable: boolean("is_available").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  bookingCount: integer("booking_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  bookingCount: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
