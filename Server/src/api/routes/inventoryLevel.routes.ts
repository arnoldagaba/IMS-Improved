import { Router } from "express";
import * as inventoryLevelController from "@/api/controllers/inventoryLevel.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { inventoryLevelParamsSchema, specificInventoryLevelParamsSchema } from "@/api/validators/inventoryLevel.validator.ts";

const router = Router();

// GET /api/v1/inventory-levels - Get all levels (optional query filters: ?itemId=...&locationId=...)
// Note: Query param validation can be added to inventoryLevelParamsSchema if needed
router.get("/", inventoryLevelController.getAllInventoryLevelsHandler);

// GET /api/v1/inventory-levels/item/:itemId - Get levels for a specific item
router.get(
    "/item/:itemId",
    validateRequest(inventoryLevelParamsSchema), // Validates itemId in params
    inventoryLevelController.getInventoryLevelsByItemHandler,
);

// GET /api/v1/inventory-levels/location/:locationId - Get levels for a specific location
router.get(
    "/location/:locationId",
    validateRequest(inventoryLevelParamsSchema), // Validates locationId in params
    inventoryLevelController.getInventoryLevelsByLocationHandler,
);

// GET /api/v1/inventory-levels/item/:itemId/location/:locationId - Get specific level
router.get(
    "/item/:itemId/location/:locationId",
    validateRequest(specificInventoryLevelParamsSchema), // Validates both params
    inventoryLevelController.getSpecificInventoryLevelHandler,
);

export default router;
