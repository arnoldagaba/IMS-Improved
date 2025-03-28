import { z } from "zod";
import { TransactionType } from "@prisma/client";

/**
 * @openapi
 * components:
 *   schemas:
 *     StockTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           description: Unique identifier for the transaction
 *           readOnly: true
 *         itemId:
 *           type: string
 *           format: cuid
 *           description: ID of the item involved in the transaction
 *         locationId:
 *           type: string
 *           format: cuid
 *           description: ID of the location where the transaction occurred
 *         changeQuantity:
 *           type: integer
 *           description: The quantity change (positive for additions, negative for reductions)
 *         type:
 *           type: string
 *           enum: [RECEIPT, ISSUE, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT]
 *           description: Type of stock transaction
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Optional notes about the transaction
 *         referenceId:
 *           type: string
 *           nullable: true
 *           description: Optional reference ID (e.g., PO number)
 *         userId:
 *           type: string
 *           format: cuid
 *           nullable: true
 *           description: ID of the user who performed the transaction
 *         transactionDate:
 *           type: string
 *           format: date-time
 *           description: When the transaction occurred
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *       required:
 *         - itemId
 *         - locationId
 *         - changeQuantity
 *         - type
 *         - transactionDate
 *
 *     CreateStockTransactionInput:
 *       type: object
 *       properties:
 *         itemId:
 *           type: string
 *           format: cuid
 *         locationId:
 *           type: string
 *           format: cuid
 *         changeQuantity:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [RECEIPT, ISSUE, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT]
 *         notes:
 *           type: string
 *           nullable: true
 *         referenceId:
 *           type: string
 *           nullable: true
 *         userId:
 *           type: string
 *           format: cuid
 *           nullable: true
 *         transactionDate:
 *           type: string
 *           format: date-time
 *       required:
 *         - itemId
 *         - locationId
 *         - changeQuantity
 *         - type
 */

// Helper array of enum values for validation
const transactionTypes = Object.values(TransactionType);

export const createStockTransactionSchema = z.object({
    body: z.object({
        itemId: z.string({ required_error: "Item ID is required" }).cuid({ message: "Invalid Item ID format" }),
        locationId: z.string({ required_error: "Location ID is required" }).cuid({ message: "Invalid Location ID format" }),
        changeQuantity: z
            .number({ required_error: "Change quantity is required" })
            .int({ message: "Change quantity must be an integer" })
            .refine((val) => val !== 0, { message: "Change quantity cannot be zero" }), // Change must be non-zero
        type: z.nativeEnum(TransactionType, {
            required_error: "Transaction type is required",
            invalid_type_error: `Invalid transaction type. Must be one of: ${transactionTypes.join(", ")}`,
        }),
        notes: z.string().optional().nullable(),
        referenceId: z.string().optional().nullable(), // e.g., PO number, SO number
        userId: z.string().cuid({ message: "Invalid User ID format" }).optional().nullable(), // Optional for now
        transactionDate: z.coerce.date().optional(), // Allow optional date override, coerce string to Date
    }),
});

// Schema for GET request query parameters (pagination/filtering)
export const getStockTransactionsSchema = z.object({
    query: z
        .object({
            page: z.coerce.number().int().positive().optional().default(1),
            limit: z.coerce.number().int().positive().max(100).optional().default(20),
            itemId: z.string().cuid({ message: "Invalid Item ID format" }).optional(),
            locationId: z.string().cuid({ message: "Invalid Location ID format" }).optional(),
            userId: z.string().cuid({ message: "Invalid User ID format" }).optional(),
            type: z.nativeEnum(TransactionType).optional(),
            startDate: z.coerce.date().optional(),
            endDate: z.coerce.date().optional(),
            sortBy: z.enum(["transactionDate", "createdAt"]).optional().default("transactionDate"),
            sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        })
        .refine(
            (data) => {
                // Ensure endDate is not before startDate if both are provided
                if (data.startDate && data.endDate) {
                    return data.endDate >= data.startDate;
                }
                return true;
            },
            { message: "endDate cannot be before startDate", path: ["endDate"] },
        ),
});

// Type helpers
export type CreateStockTransactionInput = z.infer<typeof createStockTransactionSchema>["body"];
export type GetStockTransactionsQuery = z.infer<typeof getStockTransactionsSchema>["query"];
