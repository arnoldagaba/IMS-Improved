import { Prisma } from "@prisma/client";
import prisma from "@/config/prisma.ts";

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
