import { Router } from "express";
import itemRoutes from "./item.routes.ts";
import categoryRoutes from "./category.routes.ts";
import locationRoutes from "./location.routes.ts";
import inventoryLevelRoutes from "./inventoryLevel.routes.ts";
import stockTransactionRoutes from "./stockTransaction.routes.ts";
import userRoutes from "./user.routes.ts";
import authRoutes from "./auth.routes.ts";

const router = Router();

// --- Authentication Routes --- (Generally don't require auth)
router.use("/auth", authRoutes);

// --- User Management Routes --- (Requires auth, specific roles checked internally)
router.use("/users", userRoutes);

// --- Inventory Related Routes --- (Should require auth)
// Apply requireAuth globally here or individually in each route file
// Applying here is simpler if ALL these routes need auth
// router.use(requireAuth); // <--- Add this if ALL subsequent routes need auth

router.use("/items", itemRoutes); // Apply requireAuth inside item.routes.ts if needed granularity
router.use("/categories", categoryRoutes); // Apply requireAuth inside category.routes.ts
router.use("/locations", locationRoutes); // Apply requireAuth inside location.routes.ts
router.use("/inventory-levels", inventoryLevelRoutes); // Apply requireAuth inside inventoryLevel.routes.ts
router.use("/stock-transactions", stockTransactionRoutes); // Apply requireAuth inside stockTransaction.routes.ts

// Add requireAuth within specific route files (e.g., stockTransaction.routes.ts)
// Or apply globally before mounting these resource routers if all need protection.
// Let's modify stockTransaction.routes.ts to use requireAuth.

export default router;
