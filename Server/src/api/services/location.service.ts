import prisma from "@/config/prisma.ts";
import { Prisma } from "@prisma/client";
import { CreateLocationInput, UpdateLocationInput } from "@/api/validators/location.validator.ts";
import logger from "@/config/logger.ts";

export const createLocation = async (data: CreateLocationInput) => {
    // Ensure only one primary location? Add logic here if needed.
    // This might involve a transaction if 'isPrimary' is true.
    if (data.isPrimary) {
        // If setting this location as primary, ensure no other location is primary.
        // Use a transaction to make this atomic.
        await prisma.$transaction(async (tx) => {
            // Set all other locations to isPrimary = false
            await tx.location.updateMany({
                where: { isPrimary: true },
                data: { isPrimary: false },
            });
            // Then create the new primary location
            const newLocation = await tx.location.create({
                data: {
                    ...data,
                    address: data.address ?? null,
                },
            });
            return newLocation; // Return from transaction block
        });
        // Need to re-fetch outside transaction or adjust logic as transaction result isn't directly returned here easily without casting
        // Fetching after ensures consistency
        return await prisma.location.findFirst({ where: { name: data.name } });
    } else {
        // Just create a non-primary location
        try {
            return await prisma.location.create({
                data: {
                    ...data,
                    address: data.address ?? null,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2002" && error.meta?.target === "locations_name_key") {
                    throw new Error(`Location with name '${data.name}' already exists.`);
                }
            }
            logger.error("Error creating location:", error);
            throw error;
        }
    }
};

export const findAllLocations = async () => {
    // Order primary first, then by name
    return await prisma.location.findMany({
        orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
        // Consider adding counts of items/inventory levels later
    });
};

export const findLocationById = async (id: string) => {
    return await prisma.location.findUnique({
        where: { id },
        include: { inventoryLevels: true }, // Include related data if needed
    });
};

export const updateLocation = async (id: string, data: UpdateLocationInput) => {
    // Handle 'isPrimary' update carefully to maintain only one primary.
    if (data.isPrimary === true) {
        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Set others to non-primary
            await tx.location.updateMany({
                where: {
                    id: { not: id }, // Exclude the current location being updated
                    isPrimary: true,
                },
                data: { isPrimary: false },
            });
            // Update the target location
            const updatedLocation = await tx.location.update({
                where: { id },
                data: {
                    ...data,
                    address: data.address,
                },
            });
            return updatedLocation;
        });
        // Re-fetch after transaction
        return await prisma.location.findUnique({ where: { id } });
    } else if (data.isPrimary === false) {
        // Check if we are trying to unset the *only* primary location
        const currentLocation = await prisma.location.findUnique({ where: { id } });
        if (currentLocation?.isPrimary) {
            const primaryCount = await prisma.location.count({ where: { isPrimary: true } });
            if (primaryCount <= 1) {
                // Prevent unsetting the last primary location. Require setting another as primary first.
                // Or, alternatively, allow it and have no primary location temporarily. Decision depends on business rules.
                // Let's prevent it for now for data integrity.
                throw new Error("Cannot unset the only primary location. Set another location as primary first.");
            }
        }
        // If not unsetting the only primary, proceed with normal update
        try {
            return await prisma.location.update({
                where: { id },
                data: {
                    ...data,
                    address: data.address,
                },
            });
        } catch (error) {
            // Handle P2025 (Not Found) and P2002 (Unique Name)
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2025") throw new Error(`Location with ID ${id} not found.`);
                if (error.code === "P2002" && error.meta?.target === "locations_name_key") throw new Error(`Location with name '${data.name}' already exists.`);
            }
            logger.error(`Error updating location ${id}:`, error);
            throw error;
        }
    } else {
        // Normal update (isPrimary not changing or not included in payload)
        try {
            return await prisma.location.update({
                where: { id },
                data: {
                    ...data,
                    address: data.address,
                },
            });
        } catch (error) {
            // Handle P2025 (Not Found) and P2002 (Unique Name)
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2025") throw new Error(`Location with ID ${id} not found.`);
                if (error.code === "P2002" && error.meta?.target === "locations_name_key") throw new Error(`Location with name '${data.name}' already exists.`);
            }
            logger.error(`Error updating location ${id}:`, error);
            throw error;
        }
    }
};

export const deleteLocation = async (id: string) => {
    try {
        // Check if it's the primary location before deleting
        const location = await prisma.location.findUnique({ where: { id } });
        if (location?.isPrimary) {
            throw new Error("Cannot delete the primary location. Set another location as primary first.");
        }

        // Prisma will enforce 'onDelete: Restrict' for StockTransactions.
        // 'onDelete: Cascade' for InventoryLevels means they *will* be deleted if this succeeds.
        const deletedLocation = await prisma.location.delete({
            where: { id },
        });
        return deletedLocation;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new Error(`Location with ID ${id} not found.`);
            }
            // Foreign key constraint violation (P2003) - likely due to existing StockTransactions.
            if (error.code === "P2003") {
                // Checking meta might be less reliable here
                logger.warn(`Attempted to delete location ${id} which is still referenced by stock transactions.`);
                throw new Error(`Cannot delete location ${id} because it is referenced by stock transactions.`);
            }
        }
        logger.error(`Error deleting location ${id}:`, error);
        throw error;
    }
};
