import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cookieParser from "cookie-parser";
import { StatusCodes } from "http-status-codes";
import swaggerUi from "swagger-ui-express";
import { pinoHttp } from "pino-http";
import env from "@/config/env.ts";
import mainApiRouter from "@/api/routes/index.ts";
import { errorHandler } from "@/api/middleware/errorHandler.ts";
import swaggerSpec from "@/config/swagger.ts";
import logger from "@/config/logger.ts";
import { setupSocketIO } from "./socket.ts";

// For env File
dotenv.config();

const app: Express = express();
const port = env.PORT;

const httpServer = createServer(app);
export const io = new SocketIOServer(httpServer, {
    cors: {
        origin: [env.FRONTEND_URL, "http://localhost:5173"], // Allow requests from your frontend URL(s)
        methods: ["GET", "POST"],
        credentials: true, // Allow cookies if needed for auth
    },
    // Add other options like path, transports if needed
    // path: '/socket.io',
});

// --- Request Logging Middleware ---
// Must be placed BEFORE routes but AFTER static file middleware (like Swagger UI) if body logging is needed.
// Place it early to capture as much as possible.
app.use(
    pinoHttp({
        logger: logger,
        // Optional: Customize logging further
        serializers: {
            // Example: Customize serialization
            req(req: Request) {
                req.body = req.body;
                return req;
            },
        },
        // Customize log message format (optional)
        customSuccessMessage: function (req: Request, res: Response) {
            if (res.statusCode === 404) {
                return "Resource not found";
            }
            return `${req.method} ${req.url} completed ${res.statusCode}`;
        },
        customErrorMessage: function (req, res, err) {
            return `${req.method} ${req.url} errored ${res.statusCode} with ${err.message}`;
        },
    }),
);

// --- Core Middleware ---
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health Check Route ---
app.get("/", (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({ message: "Inventory Management API is running!" });
});

// --- Socket.IO Connection Handling ---
// Pass the 'io' instance to our setup function
setupSocketIO(io);

// --- API Documentation Route ---
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        // Optional: Custom options for Swagger UI
        // explorer: true, // Enable search bar
        customSiteTitle: "Inventory API Docs",
        // customfavIcon: "/favicon.ico", // Path to your favicon
    }),
);

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
    logger.info(`[Server]: Server (HTTP + Socket.IO) is running at http://localhost:${port}`);
    logger.info(`Current environment: ${env.NODE_ENV}`);
});

// --- Graceful Shutdown --- (Optional but recommended)
const signals = ["SIGINT", "SIGTERM"];
const SHUTDOWN_TIMEOUT = 5000; // 5 seconds

signals.forEach((signal) => {
    process.on(signal, async () => {
        logger.info(`\nReceived ${signal}, closing server gracefully...`);

        // Force exit after timeout
        const forceExit = setTimeout(() => {
            logger.error("Could not close connections in time, forcefully shutting down");
            process.exit(1);
        }, SHUTDOWN_TIMEOUT);

        // Close Socket.IO connections first
        io.close((err) => {
            if (err) {
                logger.error({ err }, "Error closing Socket.IO server");
            } else {
                logger.info("Socket.IO server closed.");
            }

            // Then close the HTTP server
            server.close(async () => {
                logger.info("HTTP server closed.");
                // Disconnect Prisma Client
                try {
                    const prisma = (await import("@/config/prisma.ts")).default; // Dynamically import prisma instance
                    await prisma.$disconnect();
                    logger.info("Prisma client disconnected.");
                    clearTimeout(forceExit);
                    process.exit(0); // Exit process
                } catch (e) {
                    logger.error("Error disconnecting Prisma client:", e);
                    clearTimeout(forceExit);
                    process.exit(1);
                }
            });
        });
    });
});

export default app;
