import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { StatusCodes } from "http-status-codes";

export const validateRequest =
    (schema: AnyZodObject) =>
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                // Parse and get the validated data (includes defaults)
                const validatedData = await schema.parseAsync({
                    body: req.body,
                    query: req.query,
                    params: req.params,
                });

                if (validatedData.body) {
                    req.body = validatedData.body;
                }
                if (validatedData.query) {
                    req.query = validatedData.query;
                }
                if (validatedData.params) {
                    req.params = validatedData.params;
                }
                
                next();
            } catch (error) {
                if (error instanceof ZodError) {
                    const errorMessages = error.errors.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    }));
                    res.status(StatusCodes.BAD_REQUEST).json({
                        error: "Validation failed",
                        details: errorMessages,
                    });
                } else {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                        error: "Internal Server Error during validation",
                    });
                }
                next(error);
            }
        };
