import { z } from "zod";

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
