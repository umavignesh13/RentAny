import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  user2Id: integer("user2_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => productsTable.id, { onDelete: "set null" }),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
