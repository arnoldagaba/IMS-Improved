import { Router } from "express";
import { Role } from "@prisma/client";
import * as locationController from "@/api/controllers/location.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { createLocationSchema, updateLocationSchema, locationIdParamSchema } from "@/api/validators/location.validator.ts";
import { requireAuth } from "@/api/middleware/requireAuth.ts";
import { checkRole } from "@/api/middleware/checkRole.ts";

const router = Router();

// Apply auth to ALL location routes
router.use(requireAuth);

/**
 * @openapi
 * /locations:
 *   post:
 *     summary: Create a new location
 *     tags: [Locations]
 *     description: Creates a new storage location. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLocationInput'
 *     responses:
 *       '201':
 *         description: Location created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       '400':
 *         description: Bad Request - Invalid input data
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 */
router.post("/", checkRole([Role.ADMIN]), validateRequest(createLocationSchema), locationController.createLocationHandler);

/**
 * @openapi
 * /locations:
 *   get:
 *     summary: Get all locations
 *     tags: [Locations]
 *     description: Retrieves a list of all storage locations
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: List of locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Location'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 */
router.get("/", checkRole([Role.ADMIN, Role.STAFF]), locationController.getAllLocationsHandler);

/**
 * @openapi
 * /locations/{locationId}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Locations]
 *     description: Retrieves a specific location by its ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *     responses:
 *       '200':
 *         description: Location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: Location not found
 */
router.get("/:id", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(locationIdParamSchema), locationController.getLocationByIdHandler);

/**
 * @openapi
 * /locations/{locationId}:
 *   put:
 *     summary: Update location
 *     tags: [Locations]
 *     description: Updates an existing location. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLocationInput'
 *     responses:
 *       '200':
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       '400':
 *         description: Bad Request - Invalid input data
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: Location not found
 */
router.put("/:id", checkRole([Role.ADMIN]), validateRequest(updateLocationSchema), locationController.updateLocationHandler);

/**
 * @openapi
 * /locations/{locationId}:
 *   delete:
 *     summary: Delete location
 *     tags: [Locations]
 *     description: Deletes a location. Requires ADMIN role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *     responses:
 *       '204':
 *         description: Location deleted successfully
 *       '401':
 *         description: Unauthorized - JWT token missing or invalid
 *       '403':
 *         description: Forbidden - User does not have required role
 *       '404':
 *         description: Location not found
 *       '409':
 *         description: Conflict - Location has associated inventory
 */
router.delete("/:id", checkRole([Role.ADMIN]), validateRequest(locationIdParamSchema), locationController.deleteLocationHandler);

export default router;
