import { z } from "zod";

export const loginSchema = z.object({
    body: z.object({
        // Allow login with username OR email
        identifier: z.string({ required_error: "Username or email is required" }),
        password: z.string({ required_error: "Password is required" }),
    }),
});

// Type helper
export type LoginInput = z.infer<typeof loginSchema>["body"];
