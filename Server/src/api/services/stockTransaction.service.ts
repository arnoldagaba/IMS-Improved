import prisma from "@/config/prisma.ts";
import { Prisma, TransactionType,/* InventoryLevel, User, Item, Location */} from "@prisma/client";
// import { Decimal } from "@prisma/client/runtime/library";
import logger from "@/config/logger.ts"; // Import the logger
import { CreateStockTransactionInput, GetStockTransactionsQuery } from "@/api/validators/stockTransaction.validator.ts";
import { io } from "@/index.ts";
import { findItemById } from "./item.service.ts";

// --- Custom Error ---
export class InsufficientStockError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InsufficientStockError";
    }
}

/**
 * Creates a stock transaction and atomically updates the corresponding inventory level.
 * Uses prisma.$transaction to ensure atomicity.
 * Emits Socket.IO events on successful completion.
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
        // --- Database Transaction ---
        // Perform DB operations within a transaction to ensure atomicity.
        // The transaction block now returns the created transaction and the updated level.
        const result = await prisma.$transaction(
            async (tx) => {
                // 1. Find or Create Inventory Level record (within transaction)
                let inventoryLevel = await tx.inventoryLevel.findUnique({
                    where: { itemId_locationId: { itemId, locationId } },
                });

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
                        quantity: newQuantity, // Initial quantity if creating
                        lastRestockedAt: changeQuantity > 0 ? new Date() : undefined
                    },
                });

                // 5. Create the Stock Transaction record
                const stockTransaction = await tx.stockTransaction.create({
                    data: {
                        itemId,
                        locationId,
                        changeQuantity,
                        newQuantity: updatedInventoryLevel.quantity, // Use confirmed quantity
                        type,
                        userId: userId ?? null, // Handle optional userId
                        transactionDate: transactionDate ?? new Date(), // Use provided date or now
                        ...restData, // Includes notes, referenceId
                    },
                });

                // Return the results needed outside the transaction
                return { stockTransaction, updatedInventoryLevel };
            },
            {
                // Optional: Transaction options
                // maxWait: 5000, timeout: 10000,
                isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
                // isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            },
        );
        // --- End Database Transaction ---

        // --- Transaction Committed - Emit Socket.IO Events ---
        // Deconstruct results obtained from the successful transaction
        const { stockTransaction, updatedInventoryLevel } = result;

        // Define target rooms for item-specific and location-specific updates
        const itemRoom = `item_${stockTransaction.itemId}`;
        const locationRoom = `location_${stockTransaction.locationId}`;

        // 1. Emit general 'inventory_update' event
        // Payload contains details about the change
        const updatePayload = {
            itemId: stockTransaction.itemId,
            locationId: stockTransaction.locationId,
            newQuantity: updatedInventoryLevel.quantity,
            changeQuantity: stockTransaction.changeQuantity,
            transactionType: stockTransaction.type,
            transactionId: stockTransaction.id,
            updatedAt: updatedInventoryLevel.updatedAt, // When the inventory level itself was updated
        };

        // Emit to clients subscribed to this specific item or location
        io.to(itemRoom).to(locationRoom).emit("inventory_update", updatePayload);
        // Optionally emit to a general admin room as well if needed
        io.to('admin_room').emit('inventory_update', updatePayload);

        logger.debug({ payload: updatePayload, rooms: [itemRoom, locationRoom] }, "Emitted inventory_update event");

        // 2. Check for Low Stock condition and emit 'low_stock_alert'
        // Fetch item details (including lowStockThreshold) AFTER the transaction
        const itemDetails = await findItemById(stockTransaction.itemId);

        if (itemDetails && itemDetails.lowStockThreshold !== null) {
            // Check threshold is defined
            if (updatedInventoryLevel.quantity <= itemDetails.lowStockThreshold) {
                // Prepare the alert payload
                const lowStockPayload = {
                    itemId: itemDetails.id,
                    sku: itemDetails.sku,
                    name: itemDetails.name,
                    locationId: stockTransaction.locationId,
                    // locationName: locationDetails?.name, // Fetch location name if needed for message
                    quantity: updatedInventoryLevel.quantity,
                    lowStockThreshold: itemDetails.lowStockThreshold,
                    message: `Low stock alert: ${itemDetails.name} (${itemDetails.sku}) at location ${stockTransaction.locationId} has reached ${updatedInventoryLevel.quantity} units (threshold: ${itemDetails.lowStockThreshold}).`,
                };

                // Emit the alert (e.g., to admins or specific notification room)
                io.to("admin_room").emit("low_stock_alert", lowStockPayload);
                logger.info({ payload: lowStockPayload }, "Emitted low_stock_alert");
            }
        }
        // --- End Event Emission ---

        // Return the created stock transaction record as originally intended
        return stockTransaction;
    } catch (error) {
        // --- Error Handling ---
        if (error instanceof InsufficientStockError) {
            // Log specific stock error and re-throw
            logger.warn({ error, data }, "Insufficient stock error during transaction creation.");
            throw error;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle foreign key constraint errors (Item/Location/User not found)
            if (error.code === "P2003") {
                const field = error.meta?.field_name || "related record";
                let message = `Related record not found for field: ${field}`;
                if (field === "itemId") message = `Item with ID ${itemId} not found.`;
                if (field === "locationId") message = `Location with ID ${locationId} not found.`;
                if (field === "userId") message = `User with ID ${userId} not found.`;
                logger.warn({ error, field, data }, "Foreign key constraint violation during transaction creation.");
                throw new Error(message); // Throw a generic Error or a custom BadRequestError
            }
        }
        // Log any other unexpected errors
        logger.error({ error, data }, "Error in createStockTransaction service");
        // Re-throw for the central error handler
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

    // Adjust endDate to be inclusive of the whole day if only date is provided
    let inclusiveEndDate = endDate;
    if (endDate) {
        // Check if time component is zero (or just date was provided)
        if (endDate.getHours() === 0 && endDate.getMinutes() === 0 && endDate.getSeconds() === 0) {
            inclusiveEndDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1); // End of day
        }
    }

    const where: Prisma.StockTransactionWhereInput = {
        ...(itemId && { itemId }),
        ...(locationId && { locationId }),
        ...(userId && { userId }),
        ...(type && { type }),
        // Apply date range filtering using adjusted end date if applicable
        ...(startDate && inclusiveEndDate && { transactionDate: { gte: startDate, lte: inclusiveEndDate } }),
        ...(startDate && !inclusiveEndDate && { transactionDate: { gte: startDate } }),
        ...(!startDate && inclusiveEndDate && { transactionDate: { lte: inclusiveEndDate } }),
    };

    const orderBy: Prisma.StockTransactionOrderByWithRelationInput = {
        [sortBy]: sortOrder,
    };

    try {
        const [transactions, totalCount] = await prisma.$transaction([
            prisma.stockTransaction.findMany({
                where,
                include: {
                    item: { select: { id: true, sku: true, name: true } },
                    location: { select: { id: true, name: true } },
                    user: { select: { id: true, username: true, email: true } }, // Include user details
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
    } catch (error) {
        logger.error({ error, queryParams }, "Error fetching stock transactions");
        throw error; // Re-throw for central handling
    }
};
