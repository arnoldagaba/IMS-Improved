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