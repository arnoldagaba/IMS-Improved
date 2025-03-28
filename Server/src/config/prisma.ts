import { PrismaClient } from "@prisma/client";

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

export const prisma =
    global.prisma ||
    new PrismaClient({
        // Optional: Log database queries (useful for debugging)
        log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
    });

// If in development, store the instance in the global variable
if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

// Optional: Add a disconnect hook for graceful shutdown (useful in some environments)
process.on("beforeExit", async () => {
    console.log("Disconnecting Prisma Client...");
    await prisma.$disconnect();
});

export default prisma;
