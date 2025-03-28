import { z } from "zod";
import { Role } from "@prisma/client";

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           description: Unique identifier for the user
 *           readOnly: true
 *         username:
 *           type: string
 *           description: Unique username for login
 *           minLength: 3
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         firstName:
 *           type: string
 *           nullable: true
 *           description: User's first name
 *         lastName:
 *           type: string
 *           nullable: true
 *           description: User's last name
 *         role:
 *           type: string
 *           enum: [ADMIN, MANAGER, STAFF]
 *           description: User's role in the system
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
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
 *         - username
 *         - email
 *         - role
 *         - isActive
 *
 *     CreateUserInput:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 8
 *         firstName:
 *           type: string
 *           nullable: true
 *         lastName:
 *           type: string
 *           nullable: true
 *         role:
 *           type: string
 *           enum: [ADMIN, MANAGER, STAFF]
 *           default: STAFF
 *         isActive:
 *           type: boolean
 *           default: true
 *       required:
 *         - username
 *         - email
 *         - password
 *
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *           nullable: true
 *         lastName:
 *           type: string
 *           nullable: true
 *         role:
 *           type: string
 *           enum: [ADMIN, MANAGER, STAFF]
 *         isActive:
 *           type: boolean
 *       minProperties: 1
 */

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
