import pino, { LoggerOptions, DestinationStream } from "pino";
import env from "@/config/env.ts";

// Define options for development (pretty-printed) and production (JSON)
const developmentOptions: LoggerOptions = {
    level: "debug", // Log debug messages and above in development
    transport: {
        target: "pino-pretty", // Use pino-pretty for nice formatting
        options: {
            colorize: true, // Add colors
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss", // Human-readable timestamp
            ignore: "pid,hostname", // Optional: Hide PID and hostname
        },
    },
};

const productionOptions: LoggerOptions = {
    level: "info", // Log info messages and above in production (adjust as needed)
    // Default: outputs JSON to stdout
    // Consider adding timestamp, potentially redacting sensitive fields if needed
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
};

// Choose options based on environment
const options = env.NODE_ENV === "development" ? developmentOptions : productionOptions;

// Create and export the logger instance
const logger = pino.default(options);

// Optional: Log unhandled exceptions and rejections
process.on("uncaughtException", (err) => {
    logger.fatal(err, "Unhandled exception");
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.fatal({ promise, reason }, "Unhandled rejection");
    process.exit(1);
});

export default logger;
