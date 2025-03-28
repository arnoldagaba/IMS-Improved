import { Router } from "express";
import { Role } from "@prisma/client";
import * as userController from "@/api/controllers/user.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { requireAuth } from "@/api/middleware/requireAuth.ts";
import { checkRole } from "@/api/middleware/checkRole.ts";
import { createUserSchema, updateUserSchema, userIdParamSchema } from "@/api/validators/user.validator.ts";

const router = Router();

// All user routes require authentication
router.use(requireAuth);

// POST /api/v1/users - Create a new user (ADMIN only)
router.post(
    "/",
    checkRole([Role.ADMIN]), // Apply role check middleware
    validateRequest(createUserSchema),
    userController.createUserHandler,
);

// GET /api/v1/users - Get all users (ADMIN only)
router.get("/", checkRole([Role.ADMIN]), userController.getAllUsersHandler);

// GET /api/v1/users/:id - Get a specific user (ADMIN or owner)
// Note: Specific owner check is inside the controller for this example,
// but could be a more complex middleware if needed frequently.
router.get(
    "/:id",
    checkRole([Role.ADMIN, Role.STAFF]), // Allow both roles to hit the route
    validateRequest(userIdParamSchema),
    userController.getUserByIdHandler,
);

// PUT /api/v1/users/:id - Update a user (ADMIN or owner - controller handles specifics)
router.put(
    "/:id",
    checkRole([Role.ADMIN, Role.STAFF]), // Allow both roles
    validateRequest(updateUserSchema),
    userController.updateUserHandler,
);

// DELETE /api/v1/users/:id - Delete a user (ADMIN only)
router.delete("/:id", checkRole([Role.ADMIN]), validateRequest(userIdParamSchema), userController.deleteUserHandler);

export default router;
