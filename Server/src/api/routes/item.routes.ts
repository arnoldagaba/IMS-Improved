import { Router } from "express";
import { Role } from "@prisma/client";
import * as itemController from "@/api/controllers/item.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { requireAuth } from "@/api/middleware/requireAuth.ts";
import { checkRole } from "@/api/middleware/checkRole.ts";
import { createItemSchema, updateItemSchema, getItemByIdSchema, deleteItemSchema } from "@/api/validators/item.validator.ts";

const router = Router();

// Apply auth to ALL item routes
router.use(requireAuth);

// Apply specific role checks
router.post("/", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(createItemSchema), itemController.createItemHandler); // Allow both
router.get("/", checkRole([Role.ADMIN, Role.STAFF]), itemController.getAllItemsHandler); // Allow both
router.get("/:id", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(getItemByIdSchema), itemController.getItemByIdHandler); // Allow both
router.put("/:id", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(updateItemSchema), itemController.updateItemHandler); // Allow both
router.delete("/:id", checkRole([Role.ADMIN]), validateRequest(deleteItemSchema), itemController.deleteItemHandler); // ADMIN only

export default router;
