import { Router } from "express";
import * as stockTransactionController from "@/api/controllers/stockTransaction.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { createStockTransactionSchema, getStockTransactionsSchema } from "@/api/validators/stockTransaction.validator.ts";
// import { requireAuth } // Import authentication middleware later

const router = Router();

// POST /api/v1/stock-transactions - Create a new stock transaction
router.post(
    "/",
    // requireAuth, // Add authentication middleware later
    validateRequest(createStockTransactionSchema),
    stockTransactionController.createStockTransactionHandler,
);

// GET /api/v1/stock-transactions - Get transaction history with filtering/pagination
router.get(
    "/",
    // requireAuth, // Add authentication middleware later
    validateRequest(getStockTransactionsSchema), // Validate query parameters
    stockTransactionController.getStockTransactionsHandler,
);

export default router;
