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

/**
 * @openapi
 * /inventory-levels/low-stock:
 *   get:
 *     summary: Retrieve items at or below low stock threshold
 *     tags: [Inventory Levels]
 *     description: Returns a list of all inventory levels where the current quantity is less than or equal to the item's defined low stock threshold. Requires ADMIN or STAFF role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of low stock inventory levels.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 # Define a specific schema or inline the expected structure
 *                 type: object
 *                 properties:
 *                    id:
 *                      type: string
 *                      format: cuid
 *                    quantity:
 *                      type: integer
 *                    itemId:
 *                      type: string
 *                      format: cuid
 *                    locationId:
 *                      type: string
 *                      format: cuid
 *                    updatedAt:
 *                       type: string
 *                       format: date-time
 *                    item:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: cuid }
 *                         sku: { type: string }
 *                         name: { type: string }
 *                         unitOfMeasure: { type: string }
 *                         lowStockThreshold: { type: integer }
 *                    location:
 *                       type: object
 *                       properties:
 *                          id: { type: string, format: cuid }
 *                          name: { type: string }
 *       '401':
 *         description: Unauthorized.
 *         content: { $ref: '#/components/responses/UnauthorizedError' } # Assuming you define common responses
 *       '403':
 *         description: Forbidden.
 *         content: { $ref: '#/components/responses/ForbiddenError' }
 *       '500':
 *         description: Internal Server Error.
 *         content: { $ref: '#/components/responses/InternalServerError' }
 */
router.get(
    '/low-stock',
    checkRole(commonRoles), // Allow ADMIN and STAFF
    inventoryLevelController.getLowStockLevelsHandler
);

export default router;
