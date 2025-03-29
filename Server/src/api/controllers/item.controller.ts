import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as itemService from "@/api/services/item.service.ts";
import { CreateItemInput, UpdateItemInput } from "@/api/validators/item.validator.ts";

// Controller to handle creating a new item
export const createItemHandler = async (
    // Use intersection type for stronger typing of validated request body
    req: Request<{}, {}, CreateItemInput>,
    res: Response,
    next: NextFunction, // Pass errors to the central error handler
): Promise<void> => {
    try {
        const newItem = await itemService.createItem(req.body);
        res.status(StatusCodes.CREATED).json(newItem);
    } catch (error) {
        next(error); // Pass error to the next middleware (error handler)
    }
};

// Controller to handle fetching all items
export const getAllItemsHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const items = await itemService.findAllItems();
        res.status(StatusCodes.OK).json(items);
    } catch (error) {
        next(error);
    }
};

// Controller to handle fetching a single item by ID
export const getItemByIdHandler = async (
    // Type the params based on validation schema if possible (or use 'any' for now)
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const itemId = req.params.id;
        const item = await itemService.findItemById(itemId);

        if (!item) {
            // More specific "Not Found" handling in the controller
            res.status(StatusCodes.NOT_FOUND).json({ message: `Item with ID ${itemId} not found` });
            return;
        }
        res.status(StatusCodes.OK).json(item);
    } catch (error) {
        next(error);
    }
};

// Controller to handle updating an item by ID
export const updateItemHandler = async (
    // Type params and body based on validation
    req: Request<{ id: string }, {}, UpdateItemInput>,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const itemId = req.params.id;
        const updateData = req.body;

        const updatedItem = await itemService.updateItem(itemId, updateData);
        res.status(StatusCodes.OK).json(updatedItem);
    } catch (error) {
        // Specific error handling for "Not Found" propagated from service
        if (error instanceof Error && error.message.includes("not found")) {
            res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
            return;
        }
        // Handle specific constraint errors from service
        if (error instanceof Error && (error.message.includes("already exists") || error.message.includes("Cannot update: Category"))) {
            res.status(StatusCodes.CONFLICT).json({ message: error.message });
            return;
        }
        next(error); // Pass other errors on
    }
};

// Controller to handle deleting an item by ID
export const deleteItemHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const itemId = req.params.id;
        await itemService.deleteItem(itemId);
        // Send No Content response on successful deletion
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        // Specific error handling for "Not Found" propagated from service
        if (error instanceof Error && error.message.includes("not found")) {
            res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
            return;
        }
        // Handle constraint errors preventing deletion
        if (error instanceof Error && error.message.includes("Cannot delete")) {
            res.status(StatusCodes.CONFLICT).json({ message: error.message });
            return;
        }
        next(error);
    }
};
