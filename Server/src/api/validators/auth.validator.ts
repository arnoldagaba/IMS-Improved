import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       properties:
 *         identifier:
 *           type: string
 *           description: Username or email for login
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *       required:
 *         - identifier
 *         - password
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT access token
 *         user:
 *           $ref: '#/components/schemas/User'
 *       required:
 *         - token
 *         - user
 */

export const loginSchema = z.object({
    body: z.object({
        // Allow login with username OR email
        identifier: z.string({ required_error: "Username or email is required" }),
        password: z.string({ required_error: "Password is required" }),
    }),
});

// Type helper
export type LoginInput = z.infer<typeof loginSchema>["body"];
