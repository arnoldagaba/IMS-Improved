import { Router } from "express";
import itemRoutes from "./item.routes.ts";
import categoryRoutes from "./category.routes.ts";
import locationRoutes from "./location.routes.ts";
import inventoryLevelRoutes from "./inventoryLevel.routes.ts";
import stockTransactionRoutes from "./stockTransaction.routes.ts";
import userRoutes from "./user.routes.ts";
import authRoutes from "./auth.routes.ts";
import reportRoutes from "./reporting.routes.ts";

const router = Router();

// --- Authentication Routes ---
router.use("/auth", authRoutes);

// --- User Management Routes ---
router.use("/users", userRoutes);

// --- Reporting Routes ---
router.use("/reports", reportRoutes);

// --- Inventory Related Routes ---
router.use("/items", itemRoutes);
router.use("/categories", categoryRoutes);
router.use("/locations", locationRoutes);
router.use("/inventory-levels", inventoryLevelRoutes);
router.use("/stock-transactions", stockTransactionRoutes);

export default router;