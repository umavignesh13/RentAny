import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import productsRouter from "./products.js";
import bookingsRouter from "./bookings.js";
import reviewsRouter from "./reviews.js";
import paymentsRouter from "./payments.js";
import messagesRouter from "./messages.js";
import aiRouter from "./ai.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/products", productsRouter);
router.use("/bookings", bookingsRouter);
router.use("/reviews", reviewsRouter);
router.use("/payments", paymentsRouter);
router.use("/messages", messagesRouter);
router.use("/ai", aiRouter);
router.use("/admin", adminRouter);

export default router;
