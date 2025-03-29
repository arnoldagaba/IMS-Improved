import { Prisma } from "@prisma/client";
import prisma from "@/config/prisma.ts";
import logger from "@/config/logger.ts";

/**
 * Finds inventory levels based on optional filtering criteria.
 * Includes related Item and Location data.
 * @param where - Prisma WhereInput for filtering (e.g., { itemId: '...', locationId: '...' })
 * @param include - Optional Prisma Include argument
 * @param orderBy - Optional Prisma OrderBy argument
 * @returns Array of inventory levels matching the criteria.
 */
export const findInventoryLevels = async (
    where: Prisma.InventoryLevelWhereInput = {},
    // TODO: Add pagination (take, skip) later
    // include?: Prisma.InventoryLevelInclude,
    orderBy: Prisma.InventoryLevelOrderByWithRelationInput = { item: { name: "asc" } }, // Default order
) => {
    return await prisma.inventoryLevel.findMany({
        where,
        include: {
            item: { select: { id: true, sku: true, name: true, unitOfMeasure: true } }, // Select specific item fields
            location: { select: { id: true, name: true, isPrimary: true } }, // Select specific location fields
        },
        orderBy,
    });
};

/**
 * Finds a specific inventory level for an item at a location.
 * Returns null if the specific combination doesn't exist yet.
 * @param itemId - The ID of the item.
 * @param locationId - The ID of the location.
 * @returns The specific inventory level or null.
 */
export const findSpecificInventoryLevel = async (itemId: string, locationId: string) => {
    return await prisma.inventoryLevel.findUnique({
        where: {
            itemId_locationId: {
                // Use the compound unique index defined in schema
                itemId,
                locationId,
            },
        },
        include: {
            item: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
            location: { select: { id: true, name: true, isPrimary: true } },
        },
    });
};

/**
 * Finds all inventory levels where the quantity is at or below the item's low stock threshold.
 * Only considers items where lowStockThreshold is set (not null).
 * @returns Array of low stock inventory levels including item and location details.
 */
export const findLowStockLevels = async () => {
    try {
        const lowStockLevels = await prisma.inventoryLevel.findMany({
            where: {
                // Item must have a lowStockThreshold defined
                item: {
                    lowStockThreshold: {
                        not: null, // Ensure threshold is set
                    },
                },
            },
            include: {
                item: {
                    // Include item details needed for comparison and display
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        unitOfMeasure: true,
                        lowStockThreshold: true, // Need the threshold value
                    },
                },
                location: {
                    // Include location details
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                // Order potentially by severity (how far below threshold) or item name
                item: { name: "asc" },
            },
        });

        // Filter in application code: quantity <= lowStockThreshold
        const filteredLowStock = lowStockLevels.filter(
            (level) =>
                // level.item.lowStockThreshold should not be null here due to the 'where' clause, but check for safety
                level.item.lowStockThreshold !== null && level.quantity <= level.item.lowStockThreshold,
        );

        logger.info(`Found ${filteredLowStock.length} inventory levels at or below low stock threshold.`);
        return filteredLowStock;
    } catch (error) {
        logger.error({ error }, "Error fetching low stock levels");
        throw error; // Re-throw for central handling
    }
};

// --- Potential Alternative using $queryRaw (more complex, DB-specific) ---
// async function findLowStockLevelsRaw() {
//    // NOTE: Requires careful handling of SQL injection if parameters were dynamic
//    const result = await prisma.$queryRaw`
//       SELECT il.*, i.sku, i.name, i.unitOfMeasure, i.lowStockThreshold, l.name as locationName
//       FROM inventory_levels il
//       JOIN items i ON il.itemId = i.id
//       JOIN locations l ON il.locationId = l.id
//       WHERE i.lowStockThreshold IS NOT NULL AND il.quantity <= i.lowStockThreshold
//       ORDER BY i.name ASC;
//    `;
//    // Process the raw result into the desired object structure
//    return result;
// }
