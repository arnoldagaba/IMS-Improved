import prisma from "@/config/prisma.ts";
import { Prisma, TransactionType } from "@prisma/client";
import { CreateStockTransactionInput, GetStockTransactionsQuery } from "@/api/validators/stockTransaction.validator.ts";
import logger from "@/config/logger.ts";

// Custom Error class for insufficient stock
export class InsufficientStockError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InsufficientStockError";
    }
}

/**
 * Creates a stock transaction and atomically updates the corresponding inventory level.
 * Uses prisma.$transaction to ensure atomicity.
 * @param data - Input data for the stock transaction.
 * @returns The created stock transaction record.
 * @throws Error if Item or Location not found.
 * @throws InsufficientStockError if attempting to decrease stock below zero.
 */
export const createStockTransaction = async (data: CreateStockTransactionInput) => {
    const { itemId, locationId, changeQuantity, type, userId, transactionDate, ...restData } = data;

    // Determine if this transaction type decreases stock
    const isStockDecrease = ([TransactionType.SALES_SHIPMENT, TransactionType.ADJUSTMENT_OUT, TransactionType.TRANSFER_OUT] as TransactionType[]).includes(type);

    try {
        const result = await prisma.$transaction(
            async (tx) => {
                // 1. Find or Create Inventory Level record (within transaction)
                let inventoryLevel = await tx.inventoryLevel.findUnique({
                    where: { itemId_locationId: { itemId, locationId } },
                });

                // Get current quantity (0 if record doesn't exist yet)
                const currentQuantity = inventoryLevel?.quantity ?? 0;

                // 2. Check for sufficient stock if decreasing quantity
                if (isStockDecrease && currentQuantity + changeQuantity < 0) {
                    // changeQuantity is negative for decreases
                    throw new InsufficientStockError(
                        `Insufficient stock for item ID ${itemId} at location ID ${locationId}. Current: ${currentQuantity}, Required: ${Math.abs(changeQuantity)}`,
                    );
                }

                // 3. Calculate the new quantity
                const newQuantity = currentQuantity + changeQuantity;

                // 4. Upsert (Update or Create) the Inventory Level
                // Using upsert ensures the record exists and sets the new quantity
                const updatedInventoryLevel = await tx.inventoryLevel.upsert({
                    where: { itemId_locationId: { itemId, locationId } },
                    update: {
                        quantity: newQuantity,
                        // Update lastRestockedAt only if adding stock? Or always update? Let's update always for simplicity now.
                        lastRestockedAt: changeQuantity > 0 ? new Date() : inventoryLevel?.lastRestockedAt,
                    },
                    create: {
                        itemId: itemId,
                        locationId: locationId,
                        quantity: newQuantity, // Initial quantity will be changeQuantity if creating
                        lastRestockedAt: changeQuantity > 0 ? new Date() : undefined,
                    },
                });

                // 5. Create the Stock Transaction record
                const stockTransaction = await tx.stockTransaction.create({
                    data: {
                        itemId,
                        locationId,
                        changeQuantity,
                        newQuantity: updatedInventoryLevel.quantity, // Use quantity from the updated level record
                        type,
                        userId: userId ?? null, // Handle optional userId
                        transactionDate: transactionDate ?? new Date(), // Use provided date or now
                        ...restData, // Includes notes, referenceId
                    },
                });

                return stockTransaction; // Return the created transaction from the transaction block
            },
            {
                // Optional: Transaction options (e.g., isolation level)
                // maxWait: 5000, // default
                // timeout: 10000, // default
                isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, // Default isolation level
                // isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // Strictest, might impact performance
            },
        );

        return result;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle foreign key constraint errors (Item/Location/User not found)
            if (error.code === "P2003") {
                const field = error.meta?.field_name || "related record";
                // Customize message based on field if possible
                if (field === "itemId") throw new Error(`Item with ID ${itemId} not found.`);
                if (field === "locationId") throw new Error(`Location with ID ${locationId} not found.`);
                if (field === "userId") throw new Error(`User with ID ${userId} not found.`);
                throw new Error(`Related record not found for field: ${field}`);
            }
        }
        // Re-throw InsufficientStockError or other errors for controller/global handler
        logger.error("Error in createStockTransaction service:", error);
        throw error;
    }
};

/**
 * Retrieves stock transactions with filtering and pagination.
 * @param queryParams - Parameters for filtering and pagination.
 * @returns Object containing transactions and pagination metadata.
 */
export const findStockTransactions = async (queryParams: GetStockTransactionsQuery) => {
    const { page, limit, itemId, locationId, userId, type, startDate, endDate, sortBy, sortOrder } = queryParams;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.StockTransactionWhereInput = {
        ...(itemId && { itemId }),
        ...(locationId && { locationId }),
        ...(userId && { userId }),
        ...(type && { type }),
        ...(startDate && { transactionDate: { gte: startDate } }),
        ...(endDate && { transactionDate: { lte: endDate } }),
        ...(startDate && endDate && { transactionDate: { gte: startDate, lte: endDate } }),
    };

    const orderBy: Prisma.StockTransactionOrderByWithRelationInput = {
        [sortBy]: sortOrder,
    };

    const [transactions, totalCount] = await prisma.$transaction([
        prisma.stockTransaction.findMany({
            where,
            include: {
                item: { select: { id: true, sku: true, name: true } },
                location: { select: { id: true, name: true } },
                user: { select: { id: true, username: true } }, // Include user details if needed
            },
            orderBy,
            skip,
            take,
        }),
        prisma.stockTransaction.count({ where }),
    ]);

    return {
        data: transactions,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    };
};
