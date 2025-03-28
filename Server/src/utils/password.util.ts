import bcrypt from "bcrypt";
import env from "@/config/env.ts";

/**
 * Hashes a plain text password.
 * @param plainTextPassword - The password to hash.
 * @returns A promise that resolves with the hashed password.
 */
export const hashPassword = async (plainTextPassword: string): Promise<string> => {
    return bcrypt.hash(plainTextPassword, env.BCRYPT_SALT_ROUNDS);
};

/**
 * Compares a plain text password with a stored hash.
 * @param plainTextPassword - The password entered by the user.
 * @param hash - The hashed password stored in the database.
 * @returns A promise that resolves with true if the passwords match, false otherwise.
 */
export const comparePassword = async (plainTextPassword: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(plainTextPassword, hash);
};
