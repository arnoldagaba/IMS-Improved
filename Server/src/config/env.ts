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
    JWT_REFRESH_EXPIRES_IN: string;
    EMAIL_HOST: string;
    EMAIL_PORT: number;
    EMAIL_SECURE: boolean;
    EMAIL_USER: string;
    EMAIL_PASS: string;
    EMAIL_FROM: string;
    FRONTEND_URL: string;
}

const env: Environment = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "3001", 10),
    DATABASE_URL: process.env.DATABASE_URL || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "587", 10),
    // Convert string 'true'/'false' to boolean
    EMAIL_SECURE: process.env.EMAIL_SECURE?.toLowerCase() === "true",
    EMAIL_USER: process.env.EMAIL_USER || "",
    EMAIL_PASS: process.env.EMAIL_PASS || "",
    EMAIL_FROM: process.env.EMAIL_FROM || '"Inventory Management System" <no-reply@example.com>', // Default FROM
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5000",
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
if (!env.JWT_REFRESH_SECRET) {
    // Added validation
    console.error("FATAL ERROR: JWT_REFRESH_SECRET is not defined in .env file");
}
if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    // Warn instead of exiting? Depends if email is critical path for startup
    console.warn("WARNING: EMAIL_USER or EMAIL_PASS not defined in .env. Email sending will likely fail.");
    // process.exit(1); // Uncomment to make it fatal
}
if (!env.FRONTEND_URL) {
    console.warn("WARNING: FRONTEND_URL not defined. Password reset links might be incorrect.");
}

export default env;
