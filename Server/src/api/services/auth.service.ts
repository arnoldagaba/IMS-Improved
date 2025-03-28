import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { findUserByUsernameOrEmail } from "./user.service.ts";
import { comparePassword } from "@/utils/password.util.ts";
import env from "@/config/env.ts";
import { LoginInput } from "@/api/validators/auth.validator.ts";
import type { AuthenticatedUser } from "@/types/express/index.d.ts"; // Import payload type
import { NotFoundError } from "@/errors/NotFoundError.ts";
import { AuthenticationError } from "@/errors/AuthenticationError.ts";

/**
 * Attempts to log in a user.
 * @param loginData - Contains identifier (username/email) and password.
 * @returns An object containing the access token and user info (without password).
 * @throws AuthenticationError if credentials are invalid or user is inactive.
 * @throws NotFoundError if user does not exist.
 */
export const loginUser = async (loginData: LoginInput): Promise<{ token: string; user: Omit<User, "password"> }> => {
    const { identifier, password } = loginData;

    // 1. Find user by username or email
    const user = await findUserByUsernameOrEmail(identifier);

    if (!user) {
        throw new NotFoundError(`User with identifier '${identifier}' not found.`);
        // Or throw AuthenticationError for security (doesn't reveal if user exists)
        // throw new AuthenticationError('Invalid credentials.');
    }

    // 2. Check if user account is active
    if (!user.isActive) {
        throw new AuthenticationError("Account is inactive. Please contact an administrator.");
    }

    // 3. Compare provided password with stored hash
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
        throw new AuthenticationError("Invalid credentials.");
    }

    // 4. Generate JWT
    const payload: AuthenticatedUser = {
        id: user.id,
        role: user.role,
        // Add other non-sensitive claims if needed
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]});

    // 5. Return token and user info (without password)
    const { password: _, ...userWithoutPassword } = user; // Destructure to remove password
    return { token, user: userWithoutPassword };
};
