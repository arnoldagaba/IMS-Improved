import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "react-toastify";
import { useEffect } from "react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
    return socket;
};

export const connectSocket = (): Socket | null => {
    // Avoid creating multiple connections
    if (socket?.connected) {
        console.log("Socket already connected.");
        return socket;
    }

    const token = useAuthStore.getState().accessToken;

    // Disconnect previous instance if exists but not connected
    if (socket) {
        socket.disconnect();
    }

    console.log(`Attempting to connect socket to ${SOCKET_URL}`);
    // --- Connect ---
    // Add auth token if user is logged in
    // Backend needs to be configured to expect this in handshake.auth.token
    socket = io(SOCKET_URL, {
        reconnectionAttempts: 5, // Optional: Limit reconnection attempts
        reconnectionDelay: 3000, // Optional: Delay between attempts
        auth: token ? { token } : undefined, // Send token if available
        transports: ["websocket"], // Optional: Force websocket transport
    });

    // --- Standard Event Listeners ---
    socket.on("connect", () => {
        console.log("Socket connected:", socket?.id);
        // Optional: Emit join events here if needed on connect/reconnect
        socket?.emit("join_room", "user_updates");
    });

    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        // Handle potential cleanup or reconnection logic here if needed
        if (reason === "io server disconnect") {
            // The server deliberately disconnected the socket (e.g., logout)
            socket?.connect(); // Attempt to reconnect if needed
        }
        socket = null; // Consider nullifying on disconnect if not auto-reconnecting
    });

    socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message, error.cause);
        // Handle connection errors (e.g., show message to user, maybe trigger logout if auth error)
        if ((error as any).message?.includes("Authentication error")) {
            console.error("Socket auth failed, logging out.");
            // Might need a slight delay or better mechanism to avoid loops
            // setTimeout(() => useAuthStore.getState().logout(), 100);
        }
    });

    // --- Custom Event Listeners (Add placeholders) ---
    socket.on("inventory_update", (data) => {
        console.log("SOCKET EVENT: inventory_update", data);
        // TODO: Handle this event (e.g., update state, show notification)
    });

    socket.on("low_stock_alert", (data) => {
        console.warn("SOCKET EVENT: low_stock_alert", data);
        // TODO: Handle this event (e.g., show toast notification)
        toast.warn(data.message || "Low stock detected!");
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        console.log("Disconnecting socket...");
        socket.disconnect();
        socket = null;
    }
};

// Optional: Hook to manage socket connection based on auth state
export const useSocketConnection = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    useEffect(() => {
        if (isAuthenticated) {
            connectSocket();
        } else {
            disconnectSocket();
        }
        // Cleanup on component unmount or when auth state changes
        return () => {
            // Optional: disconnect on unmount? Depends on app structure.
            disconnectSocket();
        };
    }, [isAuthenticated]);
};
