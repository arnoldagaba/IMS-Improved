import { Router } from "express";
import { Role } from "@prisma/client";
import * as categoryController from "@/api/controllers/category.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { requireAuth } from "@/api/middleware/requireAuth.ts";
import { checkRole } from "@/api/middleware/checkRole.ts";
import { createCategorySchema, updateCategorySchema, categoryIdParamSchema } from "@/api/validators/category.validator.ts";

const router = Router();

// Apply auth to ALL category routes
router.use(requireAuth);

/**
 * @openapi
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     description: Creates a new item category. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       '201':
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       '400':
 *         description: Bad Request - Invalid input data
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '409':
 *         description: Conflict - Category name already exists
 */
router.post("/", checkRole([Role.ADMIN]), validateRequest(createCategorySchema), categoryController.createCategoryHandler);

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     description: Retrieves all item categories. Requires ADMIN or STAFF role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 */
router.get("/", checkRole([Role.ADMIN, Role.STAFF]), categoryController.getAllCategoriesHandler);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     description: Retrieves a category by its ID. Requires ADMIN or STAFF role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       '400':
 *         description: Bad Request - Invalid ID format
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: Not Found - Category does not exist
 */
router.get("/:id", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(categoryIdParamSchema), categoryController.getCategoryByIdHandler);

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     summary: Update category by ID
 *     tags: [Categories]
 *     description: Updates a category by its ID. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryInput'
 *     responses:
 *       '200':
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       '400':
 *         description: Bad Request - Invalid input data
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: Not Found - Category does not exist
 */
router.put("/:id", checkRole([Role.ADMIN]), validateRequest(updateCategorySchema), categoryController.updateCategoryHandler);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     summary: Delete category by ID
 *     tags: [Categories]
 *     description: Deletes a category by its ID. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Category deleted successfully
 *       '400':
 *         description: Bad Request - Invalid ID format
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: Not Found - Category does not exist
 */
router.delete("/:id", checkRole([Role.ADMIN]), validateRequest(categoryIdParamSchema), categoryController.deleteCategoryHandler);

export default router;
