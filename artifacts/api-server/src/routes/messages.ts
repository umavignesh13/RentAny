import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable, usersTable, productsTable } from "@workspace/db/schema";
import { eq, and, or, desc, ne } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/conversations", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const convs = await db.select().from(conversationsTable)
      .where(or(eq(conversationsTable.user1Id, userId), eq(conversationsTable.user2Id, userId)))
      .orderBy(desc(conversationsTable.lastMessageAt));

    const result = await Promise.all(convs.map(async (c) => {
      const participantId = c.user1Id === userId ? c.user2Id : c.user1Id;
      const [participant] = await db.select().from(usersTable).where(eq(usersTable.id, participantId)).limit(1);
      const [product] = c.productId
        ? await db.select().from(productsTable).where(eq(productsTable.id, c.productId)).limit(1)
        : [null];
      const [lastMsg] = await db.select().from(messagesTable)
        .where(eq(messagesTable.conversationId, c.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);
      const unread = await db.select().from(messagesTable)
        .where(and(eq(messagesTable.conversationId, c.id), eq(messagesTable.isRead, false), ne(messagesTable.senderId, userId)));

      return {
        id: c.id,
        participantId,
        participantName: participant?.name || "Unknown",
        participantAvatar: participant?.avatar || null,
        productId: c.productId || null,
        productTitle: product?.title || null,
        lastMessage: lastMsg?.content || null,
        lastMessageAt: lastMsg?.createdAt || null,
        unreadCount: unread.length,
      };
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get conversations error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/start", authenticate, async (req: AuthRequest, res) => {
  try {
    const { participantId, productId, initialMessage } = req.body;
    if (!participantId || !initialMessage) {
      res.status(400).json({ message: "participantId and initialMessage are required" });
      return;
    }
    const userId = req.userId!;

    let [existing] = await db.select().from(conversationsTable)
      .where(or(
        and(eq(conversationsTable.user1Id, userId), eq(conversationsTable.user2Id, participantId)),
        and(eq(conversationsTable.user1Id, participantId), eq(conversationsTable.user2Id, userId)),
      ))
      .limit(1);

    if (!existing) {
      const [created] = await db.insert(conversationsTable).values({
        user1Id: userId,
        user2Id: participantId,
        productId: productId || null,
        lastMessageAt: new Date(),
      }).returning();
      existing = created!;
    }

    await db.insert(messagesTable).values({
      conversationId: existing.id,
      senderId: userId,
      content: initialMessage,
      isRead: false,
    });

    const [participant] = await db.select().from(usersTable).where(eq(usersTable.id, participantId)).limit(1);
    const [product] = productId
      ? await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1)
      : [null];

    res.status(201).json({
      id: existing.id,
      participantId,
      participantName: participant?.name || "Unknown",
      participantAvatar: participant?.avatar || null,
      productId: existing.productId || null,
      productTitle: product?.title || null,
      lastMessage: initialMessage,
      lastMessageAt: existing.lastMessageAt,
      unreadCount: 0,
    });
  } catch (err) {
    req.log.error({ err }, "Start conversation error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:conversationId", authenticate, async (req: AuthRequest, res) => {
  try {
    const conversationId = parseInt(req.params["conversationId"]!);
    const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId)).limit(1);
    if (!conv || (conv.user1Id !== req.userId && conv.user2Id !== req.userId)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await db.update(messagesTable).set({ isRead: true })
      .where(and(eq(messagesTable.conversationId, conversationId), ne(messagesTable.senderId, req.userId!)));

    const msgs = await db.select({
      id: messagesTable.id,
      conversationId: messagesTable.conversationId,
      senderId: messagesTable.senderId,
      content: messagesTable.content,
      isRead: messagesTable.isRead,
      createdAt: messagesTable.createdAt,
      senderName: usersTable.name,
      senderAvatar: usersTable.avatar,
    })
      .from(messagesTable)
      .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(messagesTable.createdAt);

    res.json(msgs.map((m) => ({ ...m, senderName: m.senderName || "Unknown", senderAvatar: m.senderAvatar || null })));
  } catch (err) {
    req.log.error({ err }, "Get messages error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:conversationId", authenticate, async (req: AuthRequest, res) => {
  try {
    const conversationId = parseInt(req.params["conversationId"]!);
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ message: "Content is required" });
      return;
    }
    const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId)).limit(1);
    if (!conv || (conv.user1Id !== req.userId && conv.user2Id !== req.userId)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const [message] = await db.insert(messagesTable).values({
      conversationId,
      senderId: req.userId!,
      content,
      isRead: false,
    }).returning();
    await db.update(conversationsTable).set({ lastMessageAt: new Date() }).where(eq(conversationsTable.id, conversationId));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    res.status(201).json({ ...message, senderName: user?.name || "Unknown", senderAvatar: user?.avatar || null });
  } catch (err) {
    req.log.error({ err }, "Send message error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
