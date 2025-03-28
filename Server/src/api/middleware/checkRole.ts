import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { ForbiddenError } from "@/errors/ForbiddenError.ts";
import { AuthenticationError } from "@/errors/AuthenticationError.ts";

/**
 * Middleware factory to check if the authenticated user has one of the allowed roles.
 * Should be used *after* requireAuth middleware.
 * @param allowedRoles - An array of roles that are permitted to access the route.
 */
export const checkRole = (allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = req.user; // Get user from the request object (populated by requireAuth)

        if (!user) {
            // This should technically not happen if requireAuth is used first, but good practice to check.
            return next(new AuthenticationError("Authentication required."));
        }

        if (!allowedRoles.includes(user.role)) {
            // User does not have the required role
            return next(new ForbiddenError(`Access denied. Required role: ${allowedRoles.join(" or ")}.`));
        }

        // User has the required role, proceed
        next();
    };
};
