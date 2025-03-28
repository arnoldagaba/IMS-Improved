import prisma from "@/config/prisma.ts";
import { Prisma, Role, User } from "@prisma/client";
import { CreateUserInput, UpdateUserInput } from "@/api/validators/user.validator.ts";
import { hashPassword } from "@/utils/password.util.ts";
import { ConflictError } from "@/errors/ConflictError.ts";
import { NotFoundError } from "@/errors/NotFoundError.ts";
import logger from "@/utils/logger.ts";

// Omit password field from returned user objects
export const excludePassword = <TUser extends User, Key extends keyof TUser>(
    user: TUser,
    keys: Key[] = ["password"] as Key[], // Default keys to exclude
): Omit<TUser, Key> => {
    for (const key of keys) {
        delete user[key];
    }
    return user;
};

export const createUser = async (data: CreateUserInput): Promise<Omit<User, "password">> => {
    const { password, ...userData } = data;

    // Hash the password before storing
    const hashedPassword = await hashPassword(password);

    try {
        const newUser = await prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword, // Store the hashed password
            },
        });
        return excludePassword(newUser); // Return user data without password
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                // Check which unique field caused the error
                const target = error.meta?.target as string[];
                if (target?.includes("username")) {
                    throw new ConflictError(`Username '${data.username}' is already taken.`);
                }
                if (target?.includes("email")) {
                    throw new ConflictError(`Email '${data.email}' is already registered.`);
                }
            }
        }
        logger.error("Error creating user:", error);
        throw error; // Re-throw other errors
    }
};

export const findAllUsers = async (): Promise<Omit<User, "password">[]> => {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
    });
    // Exclude password from all users in the list
    return users.map((user) => excludePassword(user));
};

export const findUserById = async (id: string): Promise<Omit<User, "password"> | null> => {
    const user = await prisma.user.findUnique({
        where: { id },
    });
    return user ? excludePassword(user) : null;
};

// Helper to find user by username or email (useful for login)
export const findUserByUsernameOrEmail = async (identifier: string): Promise<User | null> => {
    return await prisma.user.findFirst({
        where: {
            OR: [{ username: identifier }, { email: identifier }],
        },
    });
};

export const updateUser = async (id: string, data: UpdateUserInput): Promise<Omit<User, "password">> => {
    // Note: Password update is NOT handled here. Implement separately if needed.
    if (data.password) {
        throw new Error("Password updates should be handled via a dedicated endpoint/service method.");
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...data,
                // Ensure nullable fields are handled if needed (already optional in schema)
                // firstName: data.firstName,
                // lastName: data.lastName,
            },
        });
        return excludePassword(updatedUser);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new NotFoundError(`User with ID ${id} not found.`);
            }
            if (error.code === "P2002") {
                // Handle potential unique constraint conflicts on update
                const target = error.meta?.target as string[];
                if (target?.includes("username") && data.username) {
                    throw new ConflictError(`Username '${data.username}' is already taken.`);
                }
                if (target?.includes("email") && data.email) {
                    throw new ConflictError(`Email '${data.email}' is already registered.`);
                }
            }
        }
        logger.error(`Error updating user ${id}:`, error);
        throw error;
    }
};

export const deleteUser = async (id: string): Promise<Omit<User, "password">> => {
    // Note: Consider implications of deleting users (e.g., stock transactions userId becomes null due to onDelete: SetNull)
    try {
        const userToDelete = await prisma.user.findUnique({ where: { id } });
        if (!userToDelete) {
            throw new NotFoundError(`User with ID ${id} not found.`);
        }

        // Optional: Prevent deletion of the last ADMIN user?
        if (userToDelete.role === Role.ADMIN) {
            const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
            if (adminCount <= 1) {
                throw new ConflictError("Cannot delete the last admin user.");
            }
        }

        const deletedUser = await prisma.user.delete({
            where: { id },
        });
        return excludePassword(deletedUser);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            // This shouldn't happen due to the check above, but keep for safety
            throw new NotFoundError(`User with ID ${id} not found.`);
        }
        logger.error(`Error deleting user ${id}:`, error);
        throw error;
    }
};
