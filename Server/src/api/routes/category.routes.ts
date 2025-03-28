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

// Apply specific role checks
router.post("/", checkRole([Role.ADMIN]), validateRequest(createCategorySchema), categoryController.createCategoryHandler);
router.get("/", checkRole([Role.ADMIN, Role.STAFF]), categoryController.getAllCategoriesHandler); // Allow both to read
router.get("/:id", checkRole([Role.ADMIN, Role.STAFF]), validateRequest(categoryIdParamSchema), categoryController.getCategoryByIdHandler); // Allow both to read
router.put("/:id", checkRole([Role.ADMIN]), validateRequest(updateCategorySchema), categoryController.updateCategoryHandler);
router.delete("/:id", checkRole([Role.ADMIN]), validateRequest(categoryIdParamSchema), categoryController.deleteCategoryHandler);

export default router;
