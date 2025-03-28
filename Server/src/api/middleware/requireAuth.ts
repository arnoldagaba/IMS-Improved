import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "@/config/env.ts";
import { AuthenticationError } from "@/errors/AuthenticationError.ts";
import type { AuthenticatedUser } from "@/types/express/index.d.ts";

function isAuthenticatedUser(decoded: unknown): decoded is AuthenticatedUser {
    // Implement type safety check logic here
    return typeof decoded === "object" && decoded !== null && "id" in decoded && "email" in decoded;
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AuthenticationError("No token provided or invalid format."));
    }

    const token = authHeader.split(" ")[1];

    try {
        if (!token) {
            return next(new AuthenticationError("No token provided"));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as AuthenticatedUser;

        if (!isAuthenticatedUser(decoded)) {
            return next(new AuthenticationError("Invalid token payload"));
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new AuthenticationError(`Invalid token: ${error.message}`));
        }
        if (error instanceof jwt.TokenExpiredError) {
            return next(new AuthenticationError("Token expired."));
        }
        return next(new AuthenticationError("Failed to authenticate token."));
    }
};
