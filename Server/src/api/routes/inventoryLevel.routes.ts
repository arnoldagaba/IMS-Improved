import { Router } from "express";
import { Role } from "@prisma/client";
import * as inventoryLevelController from "@/api/controllers/inventoryLevel.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { inventoryLevelParamsSchema, specificInventoryLevelParamsSchema } from "@/api/validators/inventoryLevel.validator.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import { checkRole } from "../middleware/checkRole.ts";

const router = Router();

// Apply auth to ALL inventory level routes
router.use(requireAuth);

// Apply role checks (Allow both ADMIN and STAFF for all read operations)
const commonRoles = [Role.ADMIN, Role.STAFF];

router.get("/", checkRole(commonRoles), inventoryLevelController.getAllInventoryLevelsHandler);
router.get("/item/:itemId", checkRole(commonRoles), validateRequest(inventoryLevelParamsSchema), inventoryLevelController.getInventoryLevelsByItemHandler);
router.get("/location/:locationId", checkRole(commonRoles), validateRequest(inventoryLevelParamsSchema), inventoryLevelController.getInventoryLevelsByLocationHandler);
router.get(
    "/item/:itemId/location/:locationId",
    checkRole(commonRoles),
    validateRequest(specificInventoryLevelParamsSchema),
    inventoryLevelController.getSpecificInventoryLevelHandler,
);

export default router;