/**
 * @openapi
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           description: Unique identifier for the item
 *           readOnly: true # Indicates it's generally not settable by client
 *         sku:
 *           type: string
 *           description: Stock Keeping Unit (unique business identifier)
 *           example: "LAPTOP001"
 *         name:
 *           type: string
 *           description: Name of the item
 *           example: "Dell XPS 15"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Detailed description of the item
 *         unitOfMeasure:
 *           type: string
 *           description: Unit of measurement (e.g., pcs, kg, box)
 *           example: "pcs"
 *         lowStockThreshold:
 *           type: integer
 *           format: int32
 *           nullable: true
 *           description: Optional threshold for low stock warnings
 *           example: 10
 *         imageUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           description: URL for the item's image
 *         categoryId:
 *           type: string
 *           format: cuid
 *           description: ID of the category this item belongs to
 *         category: # Included in some responses
 *           type: object
 *           readOnly: true
 *           properties:
 *             id: # If including full category
 *               type: string
 *               format: cuid
 *             name:
 *               type: string
 *           description: Details of the associated category (structure may vary by endpoint)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the item was created
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the item was last updated
 *           readOnly: true
 *       required:
 *         - id
 *         - sku
 *         - name
 *         - unitOfMeasure
 *         - categoryId
 *         - createdAt
 *         - updatedAt
 *
 *     CreateItemInput:
 *       type: object
 *       description: Data required to create a new item
 *       properties:
 *         sku:
 *           type: string
 *           description: Stock Keeping Unit (must be unique)
 *         name:
 *           type: string
 *           description: Name of the item
 *         description:
 *           type: string
 *           nullable: true
 *           description: Optional item description
 *         unitOfMeasure:
 *           type: string
 *           description: Unit of measurement
 *         lowStockThreshold:
 *           type: integer
 *           format: int32
 *           nullable: true
 *           description: Optional threshold for low stock warnings
 *         imageUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           description: Optional URL for the item's image
 *         categoryId:
 *           type: string
 *           format: cuid
 *           description: ID of the existing category to link the item to
 *       required:
 *         - sku
 *         - name
 *         - unitOfMeasure
 *         - categoryId
 *
 *     UpdateItemInput:
 *       type: object
 *       description: Data to update an existing item. At least one field must be provided. All fields are optional.
 *       properties:
 *         sku:
 *           type: string
 *           description: Stock Keeping Unit (must be unique if provided)
 *         name:
 *           type: string
 *           description: Name of the item
 *         description:
 *           type: string
 *           nullable: true
 *           description: Optional item description
 *         unitOfMeasure:
 *           type: string
 *           description: Unit of measurement
 *         lowStockThreshold:
 *           type: integer
 *           format: int32
 *           nullable: true
 *           description: Optional threshold for low stock warnings
 *         imageUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           description: Optional URL for the item's image
 *         categoryId:
 *           type: string
 *           format: cuid
 *           description: ID of the existing category to link the item to
 *       minProperties: 1 # Hint that at least one property is needed
 *
 *     ErrorResponse: # Generic error structure
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               description: A human-readable error message.
 *             code:
 *               type: string
 *               description: An optional, machine-readable error code (e.g., Prisma error code).
 *             stack:
 *               type: string
 *               description: The error stack trace (only included in development environment).
 *             details:
 *               type: array
 *               description: Used for validation errors, listing specific field issues.
 *               items:
 *                 type: object
 *                 properties:
 *                   field:
 *                     type: string
 *                     description: The path to the invalid field.
 *                   message:
 *                     type: string
 *                     description: The validation error message for the field.
 *       required:
 *         - error
 */

import { z } from "zod";

export const createItemSchema = z.object({
    body: z.object({
        sku: z.string({ required_error: "SKU is required" }).min(1, "SKU cannot be empty"),
        name: z.string({ required_error: "Name is required" }).min(1, "Name cannot be empty"),
        description: z.string().optional(),
        unitOfMeasure: z.string({ required_error: "Unit of Measure is required" }).min(1, "Unit of Measure cannot be empty"),
        lowStockThreshold: z.number().int().positive().optional().nullable(),
        imageUrl: z.string().url().optional().nullable(),
        categoryId: z.string({ required_error: "Category ID is required" }).cuid({ message: "Invalid Category ID format" }),
    }),
});

export const updateItemSchema = z.object({
    params: z.object({
        id: z.string().cuid({ message: "Invalid Item ID format" }),
    }),
    body: z
        .object({
            sku: z.string().min(1, "SKU cannot be empty").optional(),
            name: z.string().min(1, "Name cannot be empty").optional(),
            description: z.string().optional().nullable(),
            unitOfMeasure: z.string().min(1, "Unit of Measure cannot be empty").optional(),
            lowStockThreshold: z.number().int().positive().optional().nullable(),
            imageUrl: z.string().url().optional().nullable(),
            categoryId: z.string().cuid({ message: "Invalid Category ID format" }).optional(),
        })
        .partial()
        .refine((data) => Object.keys(data).length > 0, {
            // Ensure at least one field is being updated
            message: "Update body cannot be empty",
        }),
});

export const getItemByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid({ message: "Invalid Item ID format" }),
    }),
});

export const deleteItemSchema = z.object({
    params: z.object({
        id: z.string().cuid({ message: "Invalid Item ID format" }),
    }),
});

// Type helper for Create Item Input
export type CreateItemInput = z.infer<typeof createItemSchema>['body'];
// Type helper for Update Item Input
export type UpdateItemInput = z.infer<typeof updateItemSchema>['body'];