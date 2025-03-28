import prisma from "@/config/prisma.ts";
import { Prisma } from "@prisma/client";
import { CreateCategoryInput, UpdateCategoryInput } from "@/api/validators/category.validator.ts";
import logger from "@/utils/logger.ts";

export const createCategory = async (data: CreateCategoryInput) => {
    try {
        const newCategory = await prisma.category.create({
            data: {
                ...data,
                description: data.description ?? null,
            },
        });
        return newCategory;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002" && error.meta?.target === "categories_name_key") {
                throw new Error(`Category with name '${data.name}' already exists.`);
            }
        }
        logger.error("Error creating category:", error);
        throw error;
    }
};

export const findAllCategories = async () => {
    // Consider adding counts of items later: include: { _count: { select: { items: true } } }
    return await prisma.category.findMany({
        orderBy: { name: "asc" }, // Order alphabetically by name
    });
};

export const findCategoryById = async (id: string) => {
    return await prisma.category.findUnique({
        where: { id },
        // Optionally include items or item count if needed frequently
        include: { items: { select: { id: true, name: true, sku: true }, take: 10 } },
    });
};

export const updateCategory = async (id: string, data: UpdateCategoryInput) => {
    try {
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                ...data,
                description: data.description, // handles null assignment correctly
            },
        });
        return updatedCategory;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new Error(`Category with ID ${id} not found.`);
            }
            if (error.code === "P2002" && error.meta?.target === "categories_name_key") {
                throw new Error(`Category with name '${data.name}' already exists.`);
            }
        }
        logger.error(`Error updating category ${id}:`, error);
        throw error;
    }
};

export const deleteCategory = async (id: string) => {
    try {
        // Prisma will enforce the 'onDelete: Restrict' rule defined in the schema.
        // If any Item references this Category, this delete operation will fail.
        const deletedCategory = await prisma.category.delete({
            where: { id },
        });
        return deletedCategory;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new Error(`Category with ID ${id} not found.`);
            }
            // Foreign key constraint violation (P2003) because Items reference this category.
            if (error.code === "P2003" && error.meta?.field_name?.toString().includes("categoryId")) {
                logger.warn(`Attempted to delete category ${id} which still has associated items.`);
                throw new Error(`Cannot delete category ${id} because it still has associated items.`);
            }
        }
        logger.error(`Error deleting category ${id}:`, error);
        throw error;
    }
};
