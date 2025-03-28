import { z } from "zod";

export const createLocationSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Location name is required" }).min(1, "Location name cannot be empty"),
        address: z.string().optional().nullable(),
        isPrimary: z.boolean().optional().default(false),
    }),
});

export const updateLocationSchema = z.object({
    params: z.object({
        id: z.string().cuid({ message: "Invalid Location ID format" }),
    }),
    body: z
        .object({
            name: z.string().min(1, "Location name cannot be empty").optional(),
            address: z.string().optional().nullable(),
            isPrimary: z.boolean().optional(),
        })
        .partial()
        .refine((data) => Object.keys(data).length > 0, {
            message: "Update body cannot be empty",
        }),
});

export const locationIdParamSchema = z.object({
    params: z.object({
        id: z.string().cuid({ message: "Invalid Location ID format" }),
    }),
});

// Type helpers
export type CreateLocationInput = z.infer<typeof createLocationSchema>["body"];
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>["body"];
