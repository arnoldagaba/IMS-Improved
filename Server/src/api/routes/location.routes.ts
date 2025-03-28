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

// Apply specific role checks
router.post('/', checkRole([Role.ADMIN]), validateRequest(createLocationSchema), locationController.createLocationHandler);
router.get('/', checkRole([Role.ADMIN, Role.STAFF]), locationController.getAllLocationsHandler); // Allow both
router.get('/:id', checkRole([Role.ADMIN, Role.STAFF]), validateRequest(locationIdParamSchema), locationController.getLocationByIdHandler); // Allow both
router.put('/:id', checkRole([Role.ADMIN]), validateRequest(updateLocationSchema), locationController.updateLocationHandler);
router.delete('/:id', checkRole([Role.ADMIN]), validateRequest(locationIdParamSchema), locationController.deleteLocationHandler);


export default router;
