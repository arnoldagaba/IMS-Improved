import { Router } from "express";
import { Role } from "@prisma/client";
import * as itemController from "@/api/controllers/item.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { requireAuth } from "@/api/middleware/requireAuth.ts";
import { checkRole } from "@/api/middleware/checkRole.ts";
import { createItemSchema, updateItemSchema, getItemByIdSchema, deleteItemSchema } from "@/api/validators/item.validator.ts";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items] # Group endpoints under "Items" tag in UI
 *     description: Creates a new inventory item linked to a category. Requires ADMIN or STAFF role.
 *     security: # Indicates that this endpoint requires authentication
 *       - BearerAuth: [] # References the security scheme defined in swagger.ts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItemInput' # Reference the input schema
 *     responses:
 *       '201':
 *         description: Item created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item' # Reference the response schema
 *       '400': # Validation Error or Bad Request (e.g., Category not found)
 *         description: Bad Request - Invalid input data or category not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden - User does not have the required role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409': # Conflict (e.g., SKU already exists)
 *         description: Conflict - An item with the provided SKU already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500': # Internal Server Error
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(createItemSchema), itemController.createItemHandler);

/**
 * @openapi
 * /items:
 *   get:
 *     summary: Retrieve a list of all items
 *     tags: [Items]
 *     description: Returns a list of all inventory items. Requires ADMIN or STAFF role.
 *     security:
 *       - BearerAuth: []
 *     # Add query parameters here later if implementing filtering/pagination
 *     # parameters:
 *     #   - in: query
 *     #     name: categoryId
 *     #     schema:
 *     #       type: string
 *     #       format: cuid
 *     #     required: false
 *     #     description: Filter items by category ID.
 *     responses:
 *       '200':
 *         description: A list of items retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item' # Array of Item objects
 *       '401': # Unauthorized
 *         description: Unauthorized - JWT token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403': # Forbidden
 *         description: Forbidden - User does not have the required role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500': # Internal Server Error
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", checkRole([Role.ADMIN, Role.STAFF]), itemController.getAllItemsHandler);

/**
 * @openapi
 * /items/{itemId}:
 *   get:
 *     summary: Retrieve a single item by its ID
 *     tags: [Items]
 *     description: Fetches details for a specific inventory item. Requires ADMIN or STAFF role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The unique CUID identifier of the item to retrieve.
 *         example: "clxrj7j7a000008l6cfu931ws"
 *     responses:
 *       '200':
 *         description: Item details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       '400': # Validation Error (Invalid CUID format)
 *         description: Bad Request - Invalid Item ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401': # Unauthorized
 *         description: Unauthorized - JWT token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403': # Forbidden
 *         description: Forbidden - User does not have the required role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404': # Not Found
 *         description: Not Found - No item found with the specified ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500': # Internal Server Error
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(getItemByIdSchema), itemController.getItemByIdHandler);

/**
 * @openapi
 * /items/{itemId}:
 *   put:
 *     summary: Update an existing item
 *     tags: [Items]
 *     description: Modifies details of an existing inventory item. Requires ADMIN or STAFF role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The unique CUID identifier of the item to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateItemInput' # Reference the update schema
 *     responses:
 *       '200':
 *         description: Item updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item' # Return the updated item
 *       '400': # Validation Error or Bad Request
 *         description: Bad Request - Invalid input data, invalid Item ID format, or Category not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401': # Unauthorized
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403': # Forbidden
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404': # Not Found
 *         description: Not Found - Item to update not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409': # Conflict (e.g., SKU collision)
 *         description: Conflict - Updated SKU conflicts with an existing item.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500': # Internal Server Error
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(updateItemSchema), itemController.updateItemHandler);

/**
 * @openapi
 * /items/{itemId}:
 *   delete:
 *     summary: Delete an item
 *     tags: [Items]
 *     description: Removes an item from the system. Fails if the item has associated stock transactions. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The unique CUID identifier of the item to delete.
 *     responses:
 *       '204': # No Content
 *         description: Item deleted successfully. No content returned.
 *       '400': # Validation Error
 *         description: Bad Request - Invalid Item ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401': # Unauthorized
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403': # Forbidden
 *         description: Forbidden - Only ADMINs can delete items.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404': # Not Found
 *         description: Not Found - Item to delete not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409': # Conflict (Deletion constraint)
 *         description: Conflict - Cannot delete item because it is referenced by stock transactions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500': # Internal Server Error
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", checkRole([Role.ADMIN]), validateRequest(deleteItemSchema), itemController.deleteItemHandler);

export default router;
