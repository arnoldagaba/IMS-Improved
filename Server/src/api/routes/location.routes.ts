import { Router } from "express";
import * as locationController from "@/api/controllers/location.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { createLocationSchema, updateLocationSchema, locationIdParamSchema } from "@/api/validators/location.validator.ts";
import { requireAuth } from "@/api/middleware/requireAuth.ts";

const router = Router();

router.use(requireAuth);

router.post("/", validateRequest(createLocationSchema), locationController.createLocationHandler);

router.get("/", locationController.getAllLocationsHandler);

router.get("/:id", validateRequest(locationIdParamSchema), locationController.getLocationByIdHandler);

router.put("/:id", validateRequest(updateLocationSchema), locationController.updateLocationHandler);

router.delete("/:id", validateRequest(locationIdParamSchema), locationController.deleteLocationHandler);

export default router;
