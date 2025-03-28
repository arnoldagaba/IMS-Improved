import { Router } from "express";
import * as categoryController from "@/api/controllers/category.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { createCategorySchema, updateCategorySchema, categoryIdParamSchema } from "@/api/validators/category.validator.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

const router = Router();

router.use(requireAuth);

router.post("/", validateRequest(createCategorySchema), categoryController.createCategoryHandler);

router.get("/", categoryController.getAllCategoriesHandler);

router.get("/:id", validateRequest(categoryIdParamSchema), categoryController.getCategoryByIdHandler);

router.put("/:id", validateRequest(updateCategorySchema), categoryController.updateCategoryHandler);

router.delete("/:id", validateRequest(categoryIdParamSchema), categoryController.deleteCategoryHandler);

export default router;
