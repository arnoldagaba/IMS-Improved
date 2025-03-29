import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as authService from "@/api/services/auth.service.ts";
import { ForgotPasswordInput, LoginInput, ResetPasswordInput } from "@/api/validators/auth.validator.ts";
import env from "@/config/env.ts";
import logger from "@/config/logger.ts";
import { AuthenticationError } from "@/errors/AuthenticationError.ts";
import { NotFoundError } from "@/errors/NotFoundError.ts";

export const loginHandler = async (req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction) => {
    try {
        // Service now returns accessToken, refreshToken, user
        const { token: accessToken, refreshToken, user } = await authService.loginUser(req.body);

        // --- Cookie Strategy (Recommended for Refresh Token) ---
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // Not accessible via client-side script
            secure: env.NODE_ENV === "production", // Only send over HTTPS in production
            sameSite: "strict", // Mitigate CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (match DB expiry logic if any)
            path: "/api/v1/auth", // IMPORTANT: Limit cookie scope to auth paths
        });
        // --- End Cookie Strategy ---

        res.status(StatusCodes.OK).json({
            message: "Login successful",
            accessToken, // Send access token in response body
            // DON'T send refresh token in body if using HttpOnly cookie
            user,
        });
    } catch (error) {
        // AuthenticationError, NotFoundError handled by global handler
        next(error);
    }
};

// --- Add refreshHandler ---
export const refreshHandler = async (req: Request, res: Response, next: NextFunction) => {
    // --- Cookie Strategy ---
    const refreshToken = req.cookies?.refreshToken; // Get token from cookie parser
    // --- End Cookie Strategy ---

    // --- Alternative: Body Strategy (If not using cookies) ---
    // const { refreshToken } = req.body;
    // --- End Body Strategy ---

    if (!refreshToken) {
        return next(new AuthenticationError("Refresh token not provided."));
    }

    try {
        const { newAccessToken, newRefreshToken } = await authService.refreshAccessToken(refreshToken);

        // --- If using Rotation + Cookies ---
        if (newRefreshToken) {
            res.cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict", path: "/api/v1/auth" });
        }
        // --- End Rotation ---

        res.status(StatusCodes.OK).json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
        });
    } catch (error) {
        // If refresh fails (invalid token), clear the cookie
        res.clearCookie("refreshToken", { path: "/api/v1/auth" }); // Clear cookie on failure
        next(error);
    }
};

// --- Add logoutHandler ---
export const logoutHandler = async (req: Request, res: Response, next: NextFunction) => {
    // --- Cookie Strategy ---
    const refreshToken = req.cookies?.refreshToken;
    // --- End Cookie Strategy ---

    // --- Alternative: Body/Header Strategy ---
    // const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
    // --- End Strategy ---

    const userId = req.user?.id; // Assumes logout route is protected by requireAuth

    if (!userId) {
        // Should not happen if requireAuth is used, but good practice
        logger.warn("Logout attempt without authenticated user");
        res.clearCookie("refreshToken", { path: "/api/v1/auth" }); // Clear cookie anyway
        res.status(StatusCodes.OK).json({ message: "Logged out (no active session found)." });
        return;
    }

    try {
        // Tell the service to invalidate the token in the DB
        await authService.logoutUser(userId); // Service clears DB token

        // Clear the refresh token cookie on the client side
        res.clearCookie("refreshToken", { path: "/api/v1/auth" }); // IMPORTANT: path must match where it was set

        res.status(StatusCodes.OK).json({ message: "Logout successful" });
    } catch (error) {
        // Log error but still attempt to clear cookie and respond successfully
        logger.error({ error, userId }, "Error during logout process");
        res.clearCookie("refreshToken", { path: "/api/v1/auth" });
        // Don't send error details to client on logout usually
        res.status(StatusCodes.OK).json({ message: "Logout completed." });
        next(error); // Or pass to global handler if needed
    }
};

// --- Add forgotPasswordHandler ---
export const forgotPasswordHandler = async (req: Request<{}, {}, ForgotPasswordInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Service handles logic, including logging simulated token
        await authService.requestPasswordReset(req.body.email);

        // Always return a generic success message to prevent email enumeration attacks
        res.status(StatusCodes.OK).json({
            message: "If an account with that email exists, a password reset link has been sent.",
        });
    } catch (error) {
        // Log the actual error, but potentially return generic message unless it's a server fault
        if (error instanceof NotFoundError || error instanceof AuthenticationError) {
            logger.warn({ error, email: req.body.email }, "Handled error during forgot password request");
            res.status(StatusCodes.OK).json({
                message: "If an account with that email exists, a password reset link has been sent.",
            });
            return;
        }
        next(error); // Handle unexpected errors
    }
};

// --- Add resetPasswordHandler ---
export const resetPasswordHandler = async (req: Request<{}, {}, ResetPasswordInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token, password } = req.body;
        await authService.resetPassword(token, password);

        res.status(StatusCodes.OK).json({ message: "Password has been reset successfully." });
    } catch (error) {
        // AuthenticationError (invalid/expired token) handled by global handler
        next(error);
    }
};
