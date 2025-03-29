import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "@/api/middleware/requireAuth.ts";
import { checkRole } from "@/api/middleware/checkRole.ts";
import * as reportingController from "@/api/controllers/reporting.controller.ts";
import { dateRangeQuerySchema } from "@/api/validators/reporting.validator.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
// Import validation schemas if needed for query params later

const router = Router();

// All reporting routes require authentication
router.use(requireAuth);
// Reporting is usually restricted, e.g., to ADMIN or specific finance roles
router.use(checkRole([Role.ADMIN])); // Restrict all reports to ADMIN for now

/**
 * @openapi
 * /reports/inventory-value:
 *   get:
 *     summary: Generate Inventory Value Report
 *     tags: [Reports]
 *     description: Calculates the total value of current inventory based on item cost price and quantity on hand. Only includes items with a defined cost price and positive quantity. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Inventory value report generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reportDate:
 *                   type: string
 *                   format: date-time
 *                 totalValue:
 *                   type: string # Decimals are returned as strings
 *                   description: The total calculated value of the inventory.
 *                   example: "15498.50"
 *                 totalItems:
 *                   type: integer
 *                   description: The total count of physical items included in the valuation.
 *                   example: 572
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemId: { type: string, format: cuid }
 *                       sku: { type: string }
 *                       name: { type: string }
 *                       locationId: { type: string, format: cuid }
 *                       locationName: { type: string }
 *                       quantity: { type: integer }
 *                       costPrice:
 *                           type: string # Decimals are returned as strings
 *                           description: Cost price of one unit.
 *                           example: "999.99"
 *                       lineValue:
 *                           type: string # Decimals are returned as strings
 *                           description: Total value for this line (quantity * costPrice).
 *                           example: "4999.95"
 *       '401':
 *         description: Unauthorized.
 *         content: { $ref: '#/components/responses/UnauthorizedError' }
 *       '403':
 *         description: Forbidden.
 *         content: { $ref: '#/components/responses/ForbiddenError' }
 *       '500':
 *         description: Internal Server Error.
 *         content: { $ref: '#/components/responses/InternalServerError' }
 */
router.get("/inventory-value", reportingController.getInventoryValueReportHandler);

/**
 * @openapi
 * /reports/stock-movement:
 *   get:
 *     summary: Generate Stock Movement Summary Report
 *     tags: [Reports]
 *     description: Summarizes the total quantity changes for items, grouped by transaction type, within a specified date range. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date # Or date-time, depending on desired input precision
 *         description: The start date for the report period (inclusive). YYYY-MM-DD format recommended.
 *         example: "2023-10-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: The end date for the report period (inclusive). YYYY-MM-DD format recommended.
 *         example: "2023-10-31"
 *       - in: query
 *         name: itemId
 *         required: false
 *         schema:
 *           type: string
 *           format: cuid
 *         description: Optional CUID to filter the report for a specific item.
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema:
 *           type: string
 *           format: cuid
 *         description: Optional CUID to filter the report for a specific location.
 *     responses:
 *       '200':
 *         description: Stock movement report generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 filters:
 *                   type: object
 *                   properties:
 *                     itemId: { type: string, format: cuid, nullable: true }
 *                     locationId: { type: string, format: cuid, nullable: true }
 *                 summary:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemId: { type: string, format: cuid }
 *                       sku: { type: string }
 *                       name: { type: string }
 *                       locationId: { type: string, format: cuid }
 *                       locationName: { type: string }
 *                       transactionType:
 *                         type: string
 *                         enum: [ PURCHASE_RECEIVING, SALES_SHIPMENT, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER_IN, TRANSFER_OUT, INITIAL_STOCK ] # Use Prisma enum values
 *                       totalChangeQuantity:
 *                         type: integer
 *                         description: The net change in quantity for this group.
 *       '400':
 *         description: Bad Request - Invalid date format, end date before start date, or invalid filter IDs.
 *         content: { $ref: '#/components/responses/BadRequestError' } # Define common responses
 *       '401':
 *         description: Unauthorized.
 *         content: { $ref: '#/components/responses/UnauthorizedError' }
 *       '403':
 *         description: Forbidden.
 *         content: { $ref: '#/components/responses/ForbiddenError' }
 *       '500':
 *         description: Internal Server Error.
 *         content: { $ref: '#/components/responses/InternalServerError' }
 */
router.get(
    '/stock-movement',
    validateRequest(dateRangeQuerySchema), // Validate query parameters
    reportingController.getStockMovementReportHandler
);


export default router;
