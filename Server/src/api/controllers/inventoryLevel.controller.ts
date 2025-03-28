
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";
import * as inventoryLevelService from "@/api/services/inventoryLevel.service.ts";

// Handler to get all inventory levels (potentially filtered)
export const getAllInventoryLevelsHandler = async (
    req: Request, // Consider adding query param types later for filtering/pagination
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        // Basic filtering example (can be expanded)
        const where: Prisma.InventoryLevelWhereInput = {};
        if (req.query.itemId && typeof req.query.itemId === "string") {
            // Basic check, ensure CUID validation if passing directly
            where.itemId = req.query.itemId; // Validation should occur at route/middleware ideally
        }
        if (req.query.locationId && typeof req.query.locationId === "string") {
            where.locationId = req.query.locationId;
        }
        // TODO: Add pagination from query params (page, limit)

        const levels = await inventoryLevelService.findInventoryLevels(where);
        res.status(StatusCodes.OK).json(levels);
    } catch (error) {
        next(error);
    }
};

// Handler to get levels for a specific item across all locations
export const getInventoryLevelsByItemHandler = async (req: Request<{ itemId: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const itemId = req.params.itemId;
        const levels = await inventoryLevelService.findInventoryLevels({ itemId });
        res.status(StatusCodes.OK).json(levels);
    } catch (error) {
        next(error);
    }
};

// Handler to get levels for a specific location across all items
export const getInventoryLevelsByLocationHandler = async (req: Request<{ locationId: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const locationId = req.params.locationId;
        const levels = await inventoryLevelService.findInventoryLevels({ locationId });
        res.status(StatusCodes.OK).json(levels);
    } catch (error) {
        next(error);
    }
};

// Handler to get the specific level for one item at one location
export const getSpecificInventoryLevelHandler = async (req: Request<{ itemId: string; locationId: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { itemId, locationId } = req.params;
        const level = await inventoryLevelService.findSpecificInventoryLevel(itemId, locationId);

        if (!level) {
            // It's valid for a level not to exist yet (implies quantity 0)
            // Return 404 or a default object? Let's return 404 for clarity that the record itself doesn't exist.
            res.status(StatusCodes.NOT_FOUND).json({
                message: `Inventory level not found for Item ID ${itemId} at Location ID ${locationId}. Quantity is effectively zero.`,
            });
            return;
        }
        res.status(StatusCodes.OK).json(level);
    } catch (error) {
        next(error);
    }
};
