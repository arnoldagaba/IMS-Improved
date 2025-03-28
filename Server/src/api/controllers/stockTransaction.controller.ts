import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as stockTransactionService from "@/api/services/stockTransaction.service.ts";
import { InsufficientStockError } from "@/api/services/stockTransaction.service.ts";
import { CreateStockTransactionInput, GetStockTransactionsQuery } from "@/api/validators/stockTransaction.validator.ts";

// Handler to create a new stock transaction
export const createStockTransactionHandler = async (req: Request<{}, {}, CreateStockTransactionInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        // TODO: Later, get userId from authenticated request (e.g., req.user.id)
        // For now, it might be passed in the body or left null
        const transactionData = req.body;

        const newTransaction = await stockTransactionService.createStockTransaction(transactionData);
        res.status(StatusCodes.CREATED).json(newTransaction);
    } catch (error) {
        // Handle specific errors from the service
        if (error instanceof InsufficientStockError) {
            res.status(StatusCodes.CONFLICT).json({ message: error.message }); // 409 Conflict or 400 Bad Request
            return;
        }
        if (error instanceof Error && error.message.includes("not found")) {
            // Catch Item/Location/User not found errors from service
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.message }); // 400 Bad Request
            return;
        }
        // Pass other errors to the global error handler
        next(error);
    }
};

// Handler to get stock transaction history with filtering/pagination
export const getStockTransactionsHandler = async (
    req: Request & { query: GetStockTransactionsQuery }, // Modified type definition
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const queryParams = req.query;
        const result = await stockTransactionService.findStockTransactions(queryParams);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};
