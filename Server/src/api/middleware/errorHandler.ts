import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";
import env from "@/config/env.ts";
import { ApiError } from "@/errors/ApiError.ts";
import logger from "@/utils/logger.ts";

// Interface for a standardized error response
interface ErrorResponse {
    message: string;
    stack?: string; // Include stack trace only in development
    code?: string; // Optional Prisma error code
}

export const errorHandler = (
    err: Error, // Catch Error objects
    req: Request,
    res: Response,
    _next: NextFunction, // Required signature for Express error handlers
): void => {
    logger.error("Error caught by central handler:", err); // Log the full error

    let statusCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR;
    const response: ErrorResponse = {
        message: "An unexpected error occurred. Please try again later.",
    };

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        response.message = err.message;
        // Could add more specific handling based on err.isOperational if needed
    }
    // ---- Handle prisma errors ----
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        response.code = err.code;
        switch (err.code) {
            case "P2002": // Unique constraint violation
                statusCode = StatusCodes.CONFLICT; // 409
                // Provide a more generic message here, specific handling should be in controller/service if possible
                // Or try to parse err.meta.target to be more specific
                const target = (err.meta?.target as string[])?.join(", ") || "field";
                response.message = `A record with this ${target} already exists.`;
                break;
            case "P2003": // Foreign key constraint failed
                statusCode = StatusCodes.BAD_REQUEST; // 400 or CONFLICT 409 might be suitable too
                const field = err.meta?.field_name || "related record";
                // Distinguish between create/update failure and delete failure
                if (req.method === "DELETE") {
                    statusCode = StatusCodes.CONFLICT; // 409
                    response.message = `Cannot delete because the record is still referenced by a ${field}.`;
                } else {
                    statusCode = StatusCodes.BAD_REQUEST; // 400
                    response.message = `Invalid reference: The specified ${field} does not exist.`;
                }
                break;
            case "P2014": // Required relation violation on delete
                statusCode = StatusCodes.CONFLICT; // 409
                response.message = `Cannot delete: Required related records must be deleted first.`;
                break;
            case "P2025": // Record not found (for update/delete)
                statusCode = StatusCodes.NOT_FOUND; // 404
                // Use the message from the error if it's more specific (like from our service)
                response.message = err.message.includes("not found") ? err.message : "The requested record was not found.";
                break;
            // Add more specific Prisma error codes as needed
            default:
                statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
                response.message = "A database error occurred.";
        }
    }

    // Include stack trace in development only for debugging
    if (env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    res.status(statusCode).json({ error: response });
};
