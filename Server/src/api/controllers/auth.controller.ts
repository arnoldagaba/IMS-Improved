import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as authService from "@/api/services/auth.service.ts";
import { LoginInput } from "@/api/validators/auth.validator.ts";

export const loginHandler = async (req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction) => {
    try {
        const { token, user } = await authService.loginUser(req.body);

        // Optionally set token in a cookie (HttpOnly, Secure in production)
        // res.cookie('accessToken', token, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', maxAge: ... });

        res.status(StatusCodes.OK).json({
            message: "Login successful",
            token, // Send token in response body
            user, // Send user details (without password)
        });
    } catch (error) {
        // AuthenticationError, NotFoundError handled by global handler
        next(error);
    }
};

// Optional: Logout Handler (if using cookies or need server-side invalidation - complex with JWT)
// export const logoutHandler = async ( req: Request, res: Response, next: NextFunction ) => { ... };
