import dotenv from "dotenv";

dotenv.config(); // Load .env file

interface Environment {
    NODE_ENV: string;
    PORT: number;
    DATABASE_URL: string;
    // Add other environment variables here as needed
    // e.g., JWT_SECRET: string;
}

const env: Environment = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "3001", 10),
    DATABASE_URL: process.env.DATABASE_URL || "",
    // Add default values or throw errors for missing critical variables
};

// Validate essential variables
if (!env.DATABASE_URL) {
    console.error("FATAL ERROR: DATABASE_URL is not defined in .env file");
    process.exit(1); // Exit if critical env var is missing
}

export default env;
