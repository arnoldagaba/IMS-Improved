import { Router } from "express";
import * as itemController from "@/api/controllers/item.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { createItemSchema, updateItemSchema, getItemByIdSchema, deleteItemSchema } from "@/api/validators/item.validator.ts";
import { requireAuth } from "@/api/middleware/requireAuth.ts";

const router = Router();

router.use(requireAuth);

// POST /api/v1/items - Create a new item
router.post("/", validateRequest(createItemSchema), itemController.createItemHandler);

// GET /api/v1/items - Get all items
router.get("/", itemController.getAllItemsHandler);

// GET /api/v1/items/:id - Get a specific item by ID
router.get("/:id", validateRequest(getItemByIdSchema), itemController.getItemByIdHandler);

// PUT /api/v1/items/:id - Update an item by ID
router.put("/:id", validateRequest(updateItemSchema), itemController.updateItemHandler);

// DELETE /api/v1/items/:id - Delete an item by ID
router.delete("/:id", validateRequest(deleteItemSchema), itemController.deleteItemHandler);

export default router;
