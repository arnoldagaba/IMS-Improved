import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           description: Unique identifier for the location
 *           readOnly: true
 *         name:
 *           type: string
 *           description: Name of the location
 *         address:
 *           type: string
 *           nullable: true
 *           description: Physical address of the location
 *         isPrimary:
 *           type: boolean
 *           description: Whether this is the primary location
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *       required:
 *         - id
 *         - name
 *         - isPrimary
 *
 *     CreateLocationInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the location
 *         address:
 *           type: string
 *           nullable: true
 *           description: Physical address of the location
 *         isPrimary:
 *           type: boolean
 *           default: false
 *       required:
 *         - name
 *
 *     UpdateLocationInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         address:
 *           type: string
 *           nullable: true
 *         isPrimary:
 *           type: boolean
 *       minProperties: 1
 */

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
