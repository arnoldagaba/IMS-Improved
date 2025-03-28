import { User as PrismaUser, Role } from "@prisma/client";

// Define the structure of the user payload attached to the request
export interface AuthenticatedUser {
    [x: string]: boolean;
    id: string;
    role: Role;
    // Add other frequently needed non-sensitive fields if desired (e.g., username)
}

declare global {
    namespace Express {
        export interface Request {
            user?: AuthenticatedUser; // Add optional user property
        }
    }
}

// Export something to make it a module (even if empty)
export {};
