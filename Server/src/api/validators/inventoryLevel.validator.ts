import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     InventoryLevel:
 *       type: object
 *       properties:
 *         itemId:
 *           type: string
 *           format: cuid
 *           description: ID of the item
 *         locationId:
 *           type: string
 *           format: cuid
 *           description: ID of the location
 *         quantity:
 *           type: integer
 *           description: Current quantity in stock
 *         item:
 *           $ref: '#/components/schemas/Item'
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           readOnly: true
 *       required:
 *         - itemId
 *         - locationId
 *         - quantity
 */

export const inventoryLevelParamsSchema = z.object({
    params: z.object({
        itemId: z.string().cuid({ message: "Invalid Item ID format" }).optional(),
        locationId: z.string().cuid({ message: "Invalid Location ID format" }).optional(),
    }),
    // Add query param validation later if needed (e.g., for pagination, filtering by quantity)
    // query: z.object({ ... })
});

export const specificInventoryLevelParamsSchema = z.object({
    params: z.object({
        itemId: z.string().cuid({ message: "Invalid Item ID format" }),
        locationId: z.string().cuid({ message: "Invalid Location ID format" }),
    }),
});
