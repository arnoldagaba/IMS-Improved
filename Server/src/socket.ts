import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "./config/logger.ts";
import env from "./config/env.ts";
import type { AuthenticatedUser } from "./types/express/index.d.ts";

// Define types for socket events if desired (optional)
interface ServerToClientEvents {
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
}
interface ClientToServerEvents {
    hello: () => void;
}
interface InterServerEvents {
    ping: () => void;
}
interface SocketData {
    user: AuthenticatedUser; // Store authenticated user data on the socket
}

// --- Socket.IO Authentication Middleware (Example) ---
// This middleware runs for every new connection attempt.
const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
    // Example: Authenticate using JWT passed in auth handshake query or headers
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
        logger.warn("Socket connection attempt without token.");
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;

        // Basic validation of decoded payload
        if (!decoded || !decoded.id || !decoded.role) {
            throw new Error("Invalid token payload");
        }

        // Attach user data to the socket object for later use
        // You might need to augment the Socket type if using strict typing
        (socket as any).user = decoded; // Simple way, or use module augmentation / SocketData interface

        logger.info({ userId: decoded.id, socketId: socket.id }, "Socket authenticated successfully.");
        next(); // Proceed with connection
    } catch (error: any) {
        logger.error({ error: error.message, socketId: socket.id }, "Socket authentication failed.");
        next(new Error(`Authentication error: ${error.message || "Invalid token"}`));
    }
};

// --- Main Socket.IO Setup Function ---
export const setupSocketIO = (io: SocketIOServer <ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    // --- Apply Authentication Middleware ---
    io.use(authenticateSocket); // Uncomment to enable authentication for all connections

    io.on("connection", (socket: Socket) => {
        const user: AuthenticatedUser | undefined = (socket as any).user; // Retrieve user if auth enabled
        logger.info(`Client connected: ${socket.id}` + (user ? ` (User ID: ${user.id})` : ' (Unauthenticated)'));
        // logger.info(`Client connected: ${socket.id}`);

        // --- Join Rooms (Example) ---
        // You might want users to join rooms based on their role or interests
        if (user?.role === 'ADMIN') {
            socket.join('admin_room');
            logger.info(`Socket ${socket.id} (User ${user.id}) joined admin_room`);
        }
        socket.join(`user_${user?.id}`); // Join a room specific to the user ID

        // --- Handle Basic Events from Client (Optional) ---
        socket.on("ping", (callback) => {
            logger.debug(`Received ping from ${socket.id}`);
            if (typeof callback === "function") {
                callback("pong"); // Acknowledge the ping
            }
        });

        // Example: Listen for a client joining a specific item's notification room
        socket.on("watch_item", (itemId: string) => {
            if (typeof itemId === "string") {
                const roomName = `item_${itemId}`;
                socket.join(roomName);
                logger.info(`Socket ${socket.id} started watching item ${itemId} (joined room ${roomName})`);
            }
        });

        // Example: Listen for a client leaving an item's room
        socket.on("unwatch_item", (itemId: string) => {
            if (typeof itemId === "string") {
                const roomName = `item_${itemId}`;
                socket.leave(roomName);
                logger.info(`Socket ${socket.id} stopped watching item ${itemId} (left room ${roomName})`);
            }
        });

        // --- Handle Disconnection ---
        socket.on("disconnect", (reason) => {
            logger.info(`Client disconnected: ${socket.id}. Reason: ${reason}`);
            // Clean up user from rooms if necessary
        });

        // --- Handle Connection Errors ---
        socket.on("connect_error", (err) => {
            logger.error(`Socket connection error for ${socket.id}: ${err.message}`);
        });
    });

    logger.info("Socket.IO connection handler set up.");
};
