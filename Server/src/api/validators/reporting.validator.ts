// src/validation/reporting.validation.ts
import { z } from "zod";

export const dateRangeQuerySchema = z.object({
    query: z
        .object({
            startDate: z.coerce.date({ required_error: "Start date is required" }),
            endDate: z.coerce.date({ required_error: "End date is required" }),
            itemId: z.string().cuid({ message: "Invalid Item ID format" }).optional(),
            locationId: z.string().cuid({ message: "Invalid Location ID format" }).optional(),
        })
        .refine((data) => data.endDate >= data.startDate, {
            message: "End date cannot be before start date",
            path: ["endDate"], // Associate error with endDate field
        }),
});

export type DateRangeQueryInput = z.infer<typeof dateRangeQuerySchema>["query"];
