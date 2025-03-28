import { Router } from "express";
import itemRoutes from "./item.routes.ts";
import categoryRoutes from "./category.routes.ts";
import locationRoutes from "./location.routes.ts";
import inventoryLevelRoutes from "./inventoryLevel.routes.ts"

const router = Router();

// Mount resource-specific routes
router.use("/items", itemRoutes);
router.use('/categories', categoryRoutes);
router.use("/locations", locationRoutes);
router.use("inventory-levels", inventoryLevelRoutes);

export default router;
