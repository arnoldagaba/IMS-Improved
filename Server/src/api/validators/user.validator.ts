import { z } from "zod";
import { Role } from "@prisma/client";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters long");
const roles = Object.values(Role);

export const createUserSchema = z.object({
    body: z.object({
        username: z.string().min(3, "Username must be at least 3 characters long"),
        email: z.string().email("Invalid email address"),
        password: passwordSchema,
        firstName: z.string().optional().nullable(),
        lastName: z.string().optional().nullable(),
        role: z.nativeEnum(Role).optional().default(Role.STAFF), // Default to STAFF
        isActive: z.boolean().optional().default(true),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({
        id: z.string().cuid({ message: "Invalid User ID format" }),
    }),
    body: z
        .object({
            username: z.string().min(3).optional(),
            email: z.string().email().optional(),
            // Password update might be handled separately for security
            password: passwordSchema.optional(),
            firstName: z.string().optional().nullable(),
            lastName: z.string().optional().nullable(),
            role: z.nativeEnum(Role).optional(),
            isActive: z.boolean().optional(),
        })
        .partial()
        .refine((data) => Object.keys(data).length > 0, {
            message: "Update body cannot be empty",
        }),
});

// Separate schema for password update? Often requires current password.
// export const updateUserPasswordSchema = z.object({ ... });

export const userIdParamSchema = z.object({
    params: z.object({
        id: z.string().cuid({ message: "Invalid User ID format" }),
    }),
});

// Type helpers
export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
