import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import logger from "@/utils/logger.ts";

// Extend Request type to potentially hold validated data
declare global {
    namespace Express {
        interface Request {
            // Store validated data separately to avoid complex type merging issues
            validatedData?: {
                body?: any;
                query?: any;
                params?: any;
            };
        }
    }
}

export const validateRequest = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Parse and get the transformed data
        const parsed = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        // --- Store the validated and transformed data on the request ---
        req.validatedData = {
            body: parsed.body,
            query: parsed.query,
            params: parsed.params,
        };

        // Optional: Overwrite original properties (use with caution, can affect other middleware)
        // req.body = parsed.body;
        // req.query = parsed.query as any; // 'as any' needed because types still conflict technically
        // req.params = parsed.params;

        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessages = error.errors.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Validation failed", details: errorMessages });
            return;
        } else {
            logger.error({ error }, "Internal server error during validation");
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error during validation" });
            return;
        }
    }
};
