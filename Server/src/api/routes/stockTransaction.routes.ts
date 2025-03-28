import { Router } from "express";
import { Role } from "@prisma/client";
import * as stockTransactionController from "@/api/controllers/stockTransaction.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { requireAuth } from "@/api/middleware/requireAuth.ts";
import { checkRole } from "@/api/middleware/checkRole.ts";
import { createStockTransactionSchema, getStockTransactionsSchema } from "@/api/validators/stockTransaction.validator.ts";

export const router = Router();

// Apply requireAuth to all transaction routes
router.use(requireAuth);
// Optional: Apply a base role check if all transactions require at least STAFF
// router.use(checkRole([Role.ADMIN, Role.STAFF]));

/**
 * @openapi
 * /stock-transactions:
 *   post:
 *     summary: Create a new stock transaction
 *     tags: [Stock Transactions]
 *     description: Records a new stock transaction (INBOUND, OUTBOUND, ADJUSTMENT, etc.)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStockTransactionInput'
 *     responses:
 *       '201':
 *         description: Stock transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockTransaction'
 *       '400':
 *         description: Bad Request - Invalid input data
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: Referenced item or location not found
 */
router.post("/", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(createStockTransactionSchema), stockTransactionController.createStockTransactionHandler);

/**
 * @openapi
 * /stock-transactions:
 *   get:
 *     summary: Get stock transactions
 *     tags: [Stock Transactions]
 *     description: Retrieves a list of stock transactions with optional filtering
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         description: Filter by item ID
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by transaction type
 *     responses:
 *       '200':
 *         description: List of stock transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StockTransaction'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 */
router.get("/", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(getStockTransactionsSchema), stockTransactionController.getStockTransactionsHandler);

export default router;
