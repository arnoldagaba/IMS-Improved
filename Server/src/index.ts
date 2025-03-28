import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import swaggerUi from "swagger-ui-express";
import env from "@/config/env.ts";
import mainApiRouter from "@/api/routes/index.ts";
import { errorHandler } from "@/api/middleware/errorHandler.ts";
import swaggerSpec from "@/config/swagger.ts";

// For env File
dotenv.config();

const app: Express = express();
const port = env.PORT;

// --- Core Middleware ---
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- Health Check Route ---
app.get("/", (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({ message: "Inventory Management API is running!" });
});

// --- API Documentation Route ---
// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    // Optional: Custom options for Swagger UI
    explorer: true, // Enable search bar
    customSiteTitle: "Inventory API Docs",
    // customfavIcon: "/favicon.ico", // Path to your favicon
}));

// --- API Routes ---
app.use("/api/v1", mainApiRouter);

// --- 404 Handler for unmatched routes ---
app.use((_req: Request, res: Response, _next: NextFunction) => {
    res.status(StatusCodes.NOT_FOUND).json({ error: { message: "Resource not found on this server." } });
});

// --- Error Handling Middleware ---
app.use(errorHandler);

// Start Server
const server = app.listen(port, () => {
    console.log(`[Server]: Server is running at http://localhost:${port}`);
    console.log(`Current environment: ${env.NODE_ENV}`);
});

// --- Graceful Shutdown --- (Optional but recommended)
const signals = ["SIGINT", "SIGTERM"];
const SHUTDOWN_TIMEOUT = 5000; // 5 seconds

signals.forEach((signal) => {
    process.on(signal, async () => {
        console.log(`\nReceived ${signal}, closing server gracefully...`);

        // Force exit after timeout
        const forceExit = setTimeout(() => {
            console.error("Could not close connections in time, forcefully shutting down");
            process.exit(1);
        }, SHUTDOWN_TIMEOUT);

        server.close(async () => {
            console.log("HTTP server closed.");
            // Disconnect Prisma Client
            try {
                const prisma = (await import("@/config/prisma.ts")).default; // Dynamically import prisma instance
                await prisma.$disconnect();
                console.log("Prisma client disconnected.");
                clearTimeout(forceExit);
                process.exit(0); // Exit process
            } catch (e) {
                console.error("Error disconnecting Prisma client:", e);
                clearTimeout(forceExit);
                process.exit(1);
            }
        });
    });
});
