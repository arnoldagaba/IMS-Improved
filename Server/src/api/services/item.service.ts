import prisma from "@/config/prisma.ts";
import { Prisma } from "@prisma/client";
import { CreateItemInput, UpdateItemInput } from "../validators/item.validator.ts";

/**
 * Creates a new item in the database.
 * Handles potential unique constraint errors (e.g., duplicate SKU).
 * @param data - Input data for creating the item.
 * @returns The created item.
 * @throws Error if category not found or SKU already exists.
 */
export const createItem = async (data: CreateItemInput) => {
    try {
        // Optional: Check if category exists first (Prisma handles foreign key constraint anyway, but good for clearer errors)
        const categoryExists = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });
        if (!categoryExists) {
            // Consider creating a custom NotFoundError class later
            throw new Error(`Category with ID ${data.categoryId} not found.`);
        }

        const newItem = await prisma.item.create({
            data: {
                ...data,
                // Ensure optional fields that are nullable are handled correctly
                lowStockThreshold: data.lowStockThreshold ?? null,
                imageUrl: data.imageUrl ?? null,
            },
        });
        return newItem;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Check for unique constraint violation (e.g., duplicate SKU)
            if (error.code === "P2002" && error.meta?.target === "items_sku_key") {
                throw new Error(`Item with SKU '${data.sku}' already exists.`);
            }
            // Check for foreign key violation (category not found - might be redundant if checked above)
            if (error.code === "P2003" && error.meta?.field_name === "categoryId") {
                throw new Error(`Category with ID ${data.categoryId} not found.`);
            }
        }
        // Re-throw other errors or handle them as needed
        console.error("Error creating item:", error);
        throw error; // Re-throw for central error handling
    }
};

/**
 * Retrieves all items from the database.
 * TODO: Add pagination and filtering options later.
 * @returns An array of items.
 */
export const findAllItems = async () => {
    // Basic retrieval for now. Add include, where, orderBy, take, skip later.
    return await prisma.item.findMany({
        include: { category: { select: { name: true } } }, // Include category name
    });
};

/**
 * Retrieves a single item by its ID.
 * @param id - The unique ID of the item.
 * @returns The found item or null if not found.
 */
export const findItemById = async (id: string) => {
    return await prisma.item.findUnique({
        where: { id },
        include: { category: true }, // Include full category details
    });
    // Controller will handle the null case (Not Found)
};

/**
 * Updates an existing item by its ID.
 * @param id - The unique ID of the item to update.
 * @param data - The partial data to update the item with.
 * @returns The updated item.
 * @throws Error if item not found or update conflict occurs (e.g., SKU collision).
 */
export const updateItem = async (id: string, data: UpdateItemInput) => {
    try {
        // Optional: Check if the new categoryId (if provided) exists
        if (data.categoryId) {
            const categoryExists = await prisma.category.findUnique({
                where: { id: data.categoryId },
            });
            if (!categoryExists) {
                throw new Error(`Cannot update: Category with ID ${data.categoryId} not found.`);
            }
        }

        const updatedItem = await prisma.item.update({
            where: { id },
            data: {
                ...data,
                // Ensure optional fields that are nullable are handled correctly
                lowStockThreshold: data.lowStockThreshold ?? null,
                imageUrl: data.imageUrl ?? null,
                description: data.description ?? null,
            },
        });
        return updatedItem;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Record to update not found
            if (error.code === "P2025") {
                throw new Error(`Item with ID ${id} not found.`); // More specific error
            }
            // Unique constraint violation (e.g., trying to update SKU to one that already exists)
            if (error.code === "P2002" && error.meta?.target === "items_sku_key") {
                throw new Error(`Item with SKU '${data.sku}' already exists.`);
            }
            // Foreign key constraint fail (if updating categoryId to non-existent one)
            if (error.code === "P2003" && error.meta?.field_name === "categoryId") {
                throw new Error(`Cannot update: Category with ID ${data.categoryId} not found.`);
            }
        }
        console.error(`Error updating item ${id}:`, error);
        throw error; // Re-throw for central error handling
    }
};

/**
 * Deletes an item by its ID.
 * @param id - The unique ID of the item to delete.
 * @returns The deleted item data.
 * @throws Error if item not found or deletion constrained (e.g., related records prevent it if onDelete: Restrict was used elsewhere).
 */
export const deleteItem = async (id: string) => {
    try {
        // Note: Relations like InventoryLevel have onDelete: Cascade, so they will be deleted.
        // StockTransaction has onDelete: Restrict, so if transactions exist, this will fail.
        const deletedItem = await prisma.item.delete({
            where: { id },
        });
        return deletedItem;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Record to delete not found
            if (error.code === "P2025") {
                throw new Error(`Item with ID ${id} not found.`);
            }
            // Foreign key constraint violation - deletion is prevented
            if (error.code === "P2003") {
                console.warn(`Attempted to delete item ${id} which is still referenced by other records (e.g., Stock Transactions).`);
                throw new Error(`Cannot delete item ${id} because it is referenced by other records (like stock transactions).`);
            }
        }
        console.error(`Error deleting item ${id}:`, error);
        throw error; // Re-throw for central error handling
    }
};
