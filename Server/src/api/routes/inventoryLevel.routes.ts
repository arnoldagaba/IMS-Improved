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

/**
 * @openapi
 * /inventory-levels:
 *   get:
 *     summary: Get all inventory levels
 *     tags: [Inventory Levels]
 *     description: Retrieves current inventory levels across all items and locations
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: List of inventory levels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryLevel'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 */
router.get("/", checkRole(commonRoles), inventoryLevelController.getAllInventoryLevelsHandler);

/**
 * @openapi
 * /inventory-levels/item/{itemId}:
 *   get:
 *     summary: Get inventory levels by item
 *     tags: [Inventory Levels]
 *     description: Retrieves inventory levels for a specific item across all locations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *     responses:
 *       '200':
 *         description: Inventory levels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryLevel'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: Item not found
 */
router.get("/item/:itemId", checkRole(commonRoles), validateRequest(inventoryLevelParamsSchema), inventoryLevelController.getInventoryLevelsByItemHandler);

/**
 * @openapi
 * /inventory-levels/location/{locationId}:
 *   get:
 *     summary: Get inventory levels by location
 *     tags: [Inventory Levels]
 *     description: Retrieves inventory levels for a specific location across all items
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *     responses:
 *       '200':
 *         description: Inventory levels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryLevel'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: Location not found
 */
router.get("/location/:locationId", checkRole(commonRoles), validateRequest(inventoryLevelParamsSchema), inventoryLevelController.getInventoryLevelsByLocationHandler);

/**
 * @openapi
 * /inventory-levels/item/{itemId}/location/{locationId}:
 *   get:
 *     summary: Get specific inventory level
 *     tags: [Inventory Levels]
 *     description: Retrieves inventory level for a specific item at a specific location
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *     responses:
 *       '200':
 *         description: Inventory level retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryLevel'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: Item or location not found
 */
router.get(
    "/item/:itemId/location/:locationId",
    checkRole(commonRoles),
    validateRequest(specificInventoryLevelParamsSchema),
    inventoryLevelController.getSpecificInventoryLevelHandler,
);

export default router;
