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

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Reset token is required"),
        password: z.string().min(8, "Password must be at least 8 characters long"),
        // Optional: Add password confirmation field if desired
        passwordConfirmation: z.string().min(8),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
        message: "Passwords don't match",
        path: ["passwordConfirmation"], // Error associates with confirmation field
    }),
});

// Type helper
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];