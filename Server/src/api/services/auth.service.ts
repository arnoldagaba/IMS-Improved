import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { randomBytes } from "crypto";
import prisma from "@/config/prisma.ts";
import { findUserByUsernameOrEmail } from "./user.service.ts";
import { comparePassword, hashPassword } from "@/utils/password.util.ts";
import env from "@/config/env.ts";
import { LoginInput } from "@/api/validators/auth.validator.ts";
import type { AuthenticatedUser } from "@/types/express/index.d.ts"; // Import payload type
import { NotFoundError } from "@/errors/NotFoundError.ts";
import { AuthenticationError } from "@/errors/AuthenticationError.ts";
import logger from "@/config/logger.ts";

/**
 * Attempts to log in a user.
 * @param loginData - Contains identifier (username/email) and password.
 * @returns An object containing the access token and user info (without password).
 * @throws AuthenticationError if credentials are invalid or user is inactive.
 * @throws NotFoundError if user does not exist.
 */
export const loginUser = async (loginData: LoginInput): Promise<{ token: string; refreshToken: string; user: Omit<User, "password"> }> => {
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
    const accessPayload: AuthenticatedUser = {
        id: user.id,
        role: user.role,
        // Add other non-sensitive claims if needed
    };
    const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });

    // --- Generate and Store Refresh Token ---
    // 1. Generate a secure random string for the refresh token
    const refreshToken = randomBytes(40).toString("hex");

    // 2. Hash the refresh token before storing it
    const hashedRefreshToken = await hashPassword(refreshToken); // Reuse password hashing

    // 3. Store the hashed refresh token in the user record
    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });
        logger.debug({ userId: user.id }, "Stored hashed refresh token");
    } catch (dbError) {
        logger.error({ error: dbError, userId: user.id }, "Failed to store refresh token during login");
        // Decide if login should fail if refresh token can't be stored. Usually yes.
        throw new Error("Login failed: Could not prepare session."); // Generic error
    }

    // 5. Return token and user info (without password)
    const { password: _, ...userWithoutPassword } = user; // Destructure to remove password
    return { token: accessToken, refreshToken, user: userWithoutPassword };
};

// --- Refresh Token Service ---
interface RefreshResult {
    newAccessToken: string;
    newRefreshToken: string; // If implementing rotation
}

/**
 * Verifies a refresh token and issues a new access token.
 * @param providedRefreshToken The refresh token received from the client.
 * @returns An object containing the new access token.
 * @throws AuthenticationError if the token is invalid, expired, or doesn't match stored hash.
 */
export const refreshAccessToken = async (providedRefreshToken: string): Promise<RefreshResult> => {
    try {
        // 1. Find the user associated with ANY refresh token (initially)
        //    We can't find by the hashed token directly without iterating.
        //    Alternative: Could use a JWT refresh token and verify its signature/expiry first.
        //    Let's stick with opaque token + DB lookup for now. Need to find users with *any* token set.
        const usersWithToken = await prisma.user.findMany({
            where: { refreshToken: { not: null } }, // Find users that *have* a refresh token stored
        });

        let foundUser: User | null = null;

        // 2. Iterate and compare the provided token with the stored hash
        for (const user of usersWithToken) {
            if (user.refreshToken) {
                // Should always be true because of where clause, but check anyway
                const isMatch = await comparePassword(providedRefreshToken, user.refreshToken);
                if (isMatch) {
                    foundUser = user;
                    break; // Found the matching user
                }
            }
        }

        // 3. Check if user was found and is active
        if (!foundUser) {
            logger.warn({ providedTokenHint: providedRefreshToken.slice(0, 5) }, "Refresh token provided does not match any stored token");
            throw new AuthenticationError("Invalid refresh token.");
        }
        if (!foundUser.isActive) {
            logger.warn({ userId: foundUser.id }, "Attempt to refresh token for inactive user");
            throw new AuthenticationError("Account is inactive.");
        }

        // --- Token is valid, issue new access token ---
        const accessPayload: AuthenticatedUser = { id: foundUser.id, role: foundUser.role };
        const newAccessToken = jwt.sign(accessPayload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });

        // --- Optional: Refresh Token Rotation ---
        // Generate a NEW refresh token, hash it, store it, and return it.
        // This invalidates the used refresh token, enhancing security.
        const newRefreshToken = randomBytes(40).toString("hex");
        const newHashedRefreshToken = await hashPassword(newRefreshToken);
        await prisma.user.update({
            where: { id: foundUser.id },
            data: { refreshToken: newHashedRefreshToken },
        });
        logger.debug({ userId: foundUser.id }, "Rotated refresh token");
        return { newAccessToken, newRefreshToken };
        // --- End Rotation ---

        // logger.info({ userId: foundUser.id }, "Issued new access token via refresh token");
        // return { newAccessToken }; // Without rotation
    } catch (error) {
        if (error instanceof AuthenticationError) throw error; // Re-throw known auth errors
        logger.error({ error, tokenHint: providedRefreshToken.slice(0, 5) }, "Error during token refresh");
        // Don't reveal specific errors, treat as invalid token
        throw new AuthenticationError("Failed to refresh token.");
    }
};

// --- Logout Service ---
/**
 * Invalidates the refresh token for a given user.
 * @param userId The ID of the user logging out.
 * @returns Promise<void>
 */
export const logoutUser = async (userId: string): Promise<void> => {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null }, // Clear the stored refresh token
        });
        logger.info({ userId }, "User logged out, refresh token cleared.");
    } catch (error) {
        // Log error but don't necessarily fail the logout operation for the client
        logger.error({ error, userId }, "Error clearing refresh token during logout");
        // We might still want the client to clear its tokens even if DB update fails
    }
};
