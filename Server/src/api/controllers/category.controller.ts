import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as categoryService from "@/api/services/category.service.ts";
import { CreateCategoryInput, UpdateCategoryInput } from "@/api/validators/category.validator.ts";

export const createCategoryHandler = async (req: Request<{}, {}, CreateCategoryInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const newCategory = await categoryService.createCategory(req.body);
        res.status(StatusCodes.CREATED).json(newCategory);
    } catch (error) {
        // Handle unique name constraint from service
        if (error instanceof Error && error.message.includes("already exists")) {
            res.status(StatusCodes.CONFLICT).json({ message: error.message });
            return;
        }
        next(error);
    }
};

export const getAllCategoriesHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categories = await categoryService.findAllCategories();
        res.status(StatusCodes.OK).json(categories);
    } catch (error) {
        next(error);
    }
};

export const getCategoryByIdHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categoryId = req.params.id;
        const category = await categoryService.findCategoryById(categoryId);

        if (!category) {
            res.status(StatusCodes.NOT_FOUND).json({ message: `Category with ID ${categoryId} not found` });
            return;
        }
        res.status(StatusCodes.OK).json(category);
    } catch (error) {
        next(error);
    }
};

export const updateCategoryHandler = async (req: Request<{ id: string }, {}, UpdateCategoryInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categoryId = req.params.id;
        const updateData = req.body;

        const updatedCategory = await categoryService.updateCategory(categoryId, updateData);
        res.status(StatusCodes.OK).json(updatedCategory);
    } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
            res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
            return;
        }
        if (error instanceof Error && error.message.includes("already exists")) {
            res.status(StatusCodes.CONFLICT).json({ message: error.message });
            return;
        }
        next(error);
    }
};

export const deleteCategoryHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categoryId = req.params.id;
        await categoryService.deleteCategory(categoryId);
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
            res.status(StatusCodes.NOT_FOUND).json({ message: error.message });
            return;
        }
        // Handle constraint error preventing deletion (items exist)
        if (error instanceof Error && error.message.includes("Cannot delete category")) {
            res.status(StatusCodes.CONFLICT).json({ message: error.message });
            return;
        }
        next(error);
    }
};
