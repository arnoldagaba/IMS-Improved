import { z } from "zod";

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Category name is required" }).min(1, "Category name cannot be empty"),
        description: z.string().optional().nullable(),
    }),
});

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().cuid({ message: "Invalid Category ID format" }),
    }),
    body: z
        .object({
            name: z.string().min(1, "Category name cannot be empty").optional(),
            description: z.string().optional().nullable(),
        })
        .partial()
        .refine((data) => Object.keys(data).length > 0, {
            message: "Update body cannot be empty",
        }),
});

export const categoryIdParamSchema = z.object({
    params: z.object({
        id: z.string().cuid({ message: "Invalid Category ID format" }),
    }),
});

// Type helpers
export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>["body"];
