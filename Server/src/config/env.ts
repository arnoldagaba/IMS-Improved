import dotenv from "dotenv";

dotenv.config();

interface Environment {
    NODE_ENV: string;
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    BCRYPT_SALT_ROUNDS: number;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string
}

const env: Environment = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "3001", 10),
    DATABASE_URL: process.env.DATABASE_URL || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// Validate essential variables
if (!env.DATABASE_URL) {
    console.error("FATAL ERROR: DATABASE_URL is not defined in .env file");
    process.exit(1);
}
if (!env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file");
    process.exit(1);
}
if (!env.JWT_REFRESH_SECRET) { // Added validation
    console.error('FATAL ERROR: JWT_REFRESH_SECRET is not defined in .env file');
}

export default env;
