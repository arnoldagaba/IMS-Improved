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

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     description: Creates a new user in the system. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       '201':
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Bad Request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '409':
 *         description: Conflict - Email already exists
 */
router.post(
    "/",
    checkRole([Role.ADMIN]), // Apply role check middleware
    validateRequest(createUserSchema),
    userController.createUserHandler,
);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     description: Retrieves a list of all users. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 */
router.get("/", checkRole([Role.ADMIN]), userController.getAllUsersHandler);

/**
 * @openapi
 * /users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     description: Retrieves a specific user by their ID. Requires ADMIN role or user ownership.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the user to retrieve
 *     responses:
 *       '200':
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role or ownership
 *       '404':
 *         description: User not found
 */
router.get(
    "/:id",
    checkRole([Role.ADMIN, Role.STAFF]), // Allow both roles to hit the route
    validateRequest(userIdParamSchema),
    userController.getUserByIdHandler,
);

/**
 * @openapi
 * /users/{userId}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     description: Updates an existing user. Requires ADMIN role or user ownership.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       '200':
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Bad Request - Invalid input data
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role or ownership
 *       '404':
 *         description: User not found
 */
router.put(
    "/:id",
    checkRole([Role.ADMIN, Role.STAFF]), // Allow both roles
    validateRequest(updateUserSchema),
    userController.updateUserHandler,
);

/**
 * @openapi
 * /users/{userId}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     description: Deletes a user from the system. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *     responses:
 *       '204':
 *         description: User deleted successfully
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: User not found
 */
router.delete("/:id", checkRole([Role.ADMIN]), validateRequest(userIdParamSchema), userController.deleteUserHandler);

export default router;
