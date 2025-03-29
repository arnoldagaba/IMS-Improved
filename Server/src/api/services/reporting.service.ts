import prisma from "@/config/prisma.ts";
import logger from "@/utils/logger.ts";
import { Prisma, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { DateRangeQueryInput } from "@/api/validators/reporting.validator.ts";

interface InventoryValueItem {
    itemId: string;
    sku: string;
    name: string;
    locationId: string;
    locationName: string;
    quantity: number;
    costPrice: number | null;
    lineValue: Decimal; // quantity * costPrice
}

interface InventoryValueReport {
    reportDate: Date;
    totalValue: Decimal;
    totalItems: number; // Total distinct physical items across locations
    details: InventoryValueItem[];
}

/**
 * Calculates the total value of current inventory across all locations.
 * Only includes items with a defined costPrice.
 * @returns An object containing the report details and total value.
 */
export const generateInventoryValueReport = async (): Promise<InventoryValueReport> => {
    try {
        const inventoryLevels = await prisma.inventoryLevel.findMany({
            where: {
                // Only consider levels with a positive quantity
                quantity: {
                    gt: 0,
                },
                // Only consider items where costPrice is set
                item: {
                    costPrice: {
                        not: null,
                    },
                },
            },
            include: {
                item: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        costPrice: true, // Need costPrice for calculation
                    },
                },
                location: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        let totalValue = new Decimal(0);
        const reportDetails: InventoryValueItem[] = [];
        let totalItemsCount = 0; // Count physical items with value

        for (const level of inventoryLevels) {
            // Double check costPrice is not null (should be guaranteed by 'where' clause)
            if (level.item.costPrice) {
                const quantityDecimal = new Decimal(level.quantity);
                const lineValue = quantityDecimal.times(level.item.costPrice); // Use Decimal multiplication

                reportDetails.push({
                    itemId: level.item.id,
                    sku: level.item.sku,
                    name: level.item.name,
                    locationId: level.location.id,
                    locationName: level.location.name,
                    quantity: level.quantity,
                    costPrice: level.item.costPrice,
                    lineValue: lineValue,
                });

                totalValue = totalValue.plus(lineValue); // Use Decimal addition
                totalItemsCount += level.quantity; // Add the physical count
            }
        }

        logger.info(`Generated inventory value report. Total Value: ${totalValue}, Total Items: ${totalItemsCount}`);

        return {
            reportDate: new Date(),
            totalValue: totalValue,
            totalItems: totalItemsCount,
            details: reportDetails,
        };
    } catch (error) {
        logger.error({ error }, "Error generating inventory value report");
        throw error;
    }
};

// --- Stock Movement Summary Logic ---
interface StockMovementSummaryItem {
    itemId: string;
    sku: string;
    name: string;
    locationId: string;
    locationName: string;
    transactionType: TransactionType;
    totalChangeQuantity: number;
}

interface StockMovementReport {
    startDate: Date;
    endDate: Date;
    filters: {
        // Record the filters used
        itemId?: string;
        locationId?: string;
    };
    summary: StockMovementSummaryItem[];
}

/**
 * Generates a report summarizing stock movements within a date range.
 * Groups movements by item, location, and transaction type.
 * @param queryParams - Contains startDate, endDate, and optional itemId/locationId filters.
 * @returns An object containing the summary report.
 */
export const generateStockMovementReport = async (queryParams: DateRangeQueryInput): Promise<StockMovementReport> => {
    const { startDate, endDate, itemId, locationId } = queryParams;

    try {
        const whereClause: Prisma.StockTransactionWhereInput = {
            transactionDate: {
                gte: startDate, // Greater than or equal to start date
                // Add 1 day to endDate and use 'lt' for inclusive end date matching
                // Or adjust time to 23:59:59.999
                lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1), // Inclusive end day
                // lte: endDate // If end date is meant to be exclusive end of day
            },
            ...(itemId && { itemId }), // Add optional filters
            ...(locationId && { locationId }),
        };

        const movementSummary = await prisma.stockTransaction.groupBy({
            by: ["itemId", "locationId", "type"], // Group by these fields
            where: whereClause,
            _sum: {
                changeQuantity: true, // Sum the quantity changes within each group
            },
            orderBy: [
                // Optional ordering
                { itemId: "asc" },
                { locationId: "asc" },
                { type: "asc" },
            ],
        });

        // Now, enrich the summary with item and location names for readability
        // This requires fetching related data. We can do this efficiently.

        const itemIds = [...new Set(movementSummary.map((s) => s.itemId))];
        const locationIds = [...new Set(movementSummary.map((s) => s.locationId))];

        // Fetch item and location details in parallel
        const [itemDetails, locationDetails] = await Promise.all([
            prisma.item.findMany({
                where: { id: { in: itemIds } },
                select: { id: true, sku: true, name: true },
            }),
            prisma.location.findMany({
                where: { id: { in: locationIds } },
                select: { id: true, name: true },
            }),
        ]);

        // Create maps for easy lookup
        const itemMap = new Map(itemDetails.map((i) => [i.id, i]));
        const locationMap = new Map(locationDetails.map((l) => [l.id, l]));

        // Format the final report structure
        const formattedSummary: StockMovementSummaryItem[] = movementSummary.map((group) => {
            const item = itemMap.get(group.itemId);
            const location = locationMap.get(group.locationId);
            return {
                itemId: group.itemId,
                sku: item?.sku ?? "N/A",
                name: item?.name ?? "N/A",
                locationId: group.locationId,
                locationName: location?.name ?? "N/A",
                transactionType: group.type,
                totalChangeQuantity: group._sum.changeQuantity ?? 0, // Use the summed quantity
            };
        });

        logger.info(`Generated stock movement report for ${startDate.toISOString()} to ${endDate.toISOString()}`);

        return {
            startDate,
            endDate,
            filters: { itemId, locationId },
            summary: formattedSummary,
        };
    } catch (error) {
        logger.error({ error, queryParams }, "Error generating stock movement report");
        throw error;
    }
};