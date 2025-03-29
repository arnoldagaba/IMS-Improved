import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "@/config/env.ts";
import { Role } from "@prisma/client";
import { AuthenticationError } from "@/errors/AuthenticationError.ts";
import { AuthenticatedUser } from "@/types/express/index.js";
import logger from "@/config/logger.ts";

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AuthenticationError("No token provided or invalid format."));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return next(new AuthenticationError("No token provided or invalid format."));
    }

    try {
        const decodedPayload = jwt.verify(token, env.JWT_SECRET);

        // --- Explicit Payload Validation ---
        if (
            typeof decodedPayload !== "object" || // Must be an object
            !decodedPayload.id ||
            typeof decodedPayload.id !== "string" || // Must have string 'id'
            !decodedPayload.role ||
            typeof decodedPayload.role !== "string" || // Must have string 'role'
            !Object.values(Role).includes(decodedPayload.role as Role) // Role must be a valid enum value
        ) {
            // Log the invalid payload for debugging
            logger.error("Invalid JWT payload structure received:", decodedPayload);
            // Throw a specific error to be caught below
            throw new Error("Invalid token payload structure");
        }

        // --- Payload is Valid - Cast and Assign ---
        // Now it's safer to treat it as AuthenticatedUser
        req.user = decodedPayload as AuthenticatedUser;

        next();
    } catch (error) {
        // --- Enhanced Error Handling ---
        if (error instanceof Error && error.message === "Invalid token payload structure") {
            return next(new AuthenticationError(error.message)); // Specific message for bad payload
        }
        if (error instanceof jwt.JsonWebTokenError) {
            // Handles 'invalid signature', 'jwt malformed', 'invalid token' etc.
            return next(new AuthenticationError(`Invalid token: ${error.message}`));
        }
        if (error instanceof jwt.TokenExpiredError) {
            return next(new AuthenticationError("Token expired."));
        }
        // Log unexpected errors during verification
        logger.error("Unexpected error during token verification:", error);
        return next(new AuthenticationError("Failed to authenticate token."));
    }
};
