import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as userService from "@/api/services/user.service.ts";
import { CreateUserInput, UpdateUserInput } from "@/api/validators/user.validator.ts";
import { ForbiddenError } from "@/errors/ForbiddenError.ts";
import { NotFoundError } from "@/errors/NotFoundError.ts";
import { User } from "@prisma/client";

// Only ADMINs should create users
export const createUserHandler = async (req: Request<{}, {}, CreateUserInput>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const newUser = await userService.createUser(req.body);
        res.status(StatusCodes.CREATED).json(newUser);
    } catch (error) {
        // ConflictError is handled by global handler now
        next(error);
    }
};

// Only ADMINs should see all users? Or maybe staff too? Let's say ADMIN for now.
export const getAllUsersHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const users = await userService.findAllUsers();
        res.status(StatusCodes.OK).json(users);
    } catch (error) {
        next(error);
    }
};

// Users should be able to get their own profile, ADMINs can get any.
export const getUserByIdHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userIdToFetch = req.params.id;
        const requestingUser = req.user; // From requireAuth middleware

        // Security Check: Allow users to get their own profile, or ADMINs to get any.
        if (requestingUser?.role !== "ADMIN" && requestingUser?.id !== userIdToFetch) {
            // Use ForbiddenError (implementation in checkRole is often cleaner for routes)
            // Alternatively, check here if not using route-level middleware for this specific case
            next(new ForbiddenError("You can only view your own profile."));
            return;
            // Let's rely on route setup or keep it simple for now: assume ADMIN check is done at route level
        }

        const user = await userService.findUserById(userIdToFetch);

        if (!user) {
            // Use NotFoundError
            throw new NotFoundError(`User with ID ${userIdToFetch} not found`);
        }
        res.status(StatusCodes.OK).json(user);
    } catch (error) {
        next(error);
    }
};

// ADMINs can update any user, Staff might update their own profile (limited fields?)
export const updateUserHandler = async (req: Request<{ id: string }, {}, UpdateUserInput>, res: Response, next: NextFunction): Promise<void> => {
    const userIdToUpdate = req.params.id;
    const updateData = req.body;
    const requestingUser = req.user as User;

    // --- Authorization Logic Example ---
    // ADMIN can update anyone
    // STAFF can only update their own profile (and maybe limited fields)
    if (requestingUser?.role !== "ADMIN") {
        if (requestingUser?.id !== userIdToUpdate) {
            next(new ForbiddenError("You can only update your own profile."));
            return;
        }
        // Prevent STAFF from changing their role or isActive status
        if (updateData.role && updateData.role !== requestingUser?.role) {
            next(new ForbiddenError("You cannot change your own role."));
            return;
        }
        if (updateData.isActive !== undefined && updateData.isActive !== requestingUser?.isActive) {
            // Assuming isActive is part of AuthenticatedUser or refetch user
            // Refetching might be safer: const currentUser = await userService.findUserById(requestingUser.id);
            // if(updateData.isActive !== undefined && updateData.isActive !== currentUser?.isActive) { ... }
            next(new ForbiddenError("You cannot change your own active status."));
            return;
        }
    }
    // --- End Authorization Logic ---

    try {
        const updatedUser = await userService.updateUser(userIdToUpdate, updateData);
        res.status(StatusCodes.OK).json(updatedUser);
    } catch (error) {
        // NotFoundError, ConflictError handled by global handler
        next(error);
    }
};

// Only ADMINs should delete users
export const deleteUserHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userIdToDelete = req.params.id;
        const requestingUser = req.user;

        // Prevent deleting own account? Or the last admin?
        if (requestingUser?.id === userIdToDelete) {
            next(new ForbiddenError("You cannot delete your own account via this endpoint."));
            return;
        }
        // Logic to prevent deleting last admin might be better in the service

        await userService.deleteUser(userIdToDelete);
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        // NotFoundError, ConflictError handled by global handler
        next(error);
    }
};
