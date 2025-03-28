import { Router } from "express";
import { Role } from "@prisma/client";
import * as stockTransactionController from "@/api/controllers/stockTransaction.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { requireAuth } from "@/api/middleware/requireAuth.ts";
import { checkRole } from "@/api/middleware/checkRole.ts";
import { createStockTransactionSchema, getStockTransactionsSchema } from "@/api/validators/stockTransaction.validator.ts";

const router = Router();

// Apply requireAuth to all transaction routes
router.use(requireAuth);
// Optional: Apply a base role check if all transactions require at least STAFF
// router.use(checkRole([Role.ADMIN, Role.STAFF]));

// POST /api/v1/stock-transactions - Create a new stock transaction
router.post(
    "/",
    // Add specific role check if needed (e.g., maybe only ADMIN can do INITIAL_STOCK?)
    // Could add middleware here or check inside controller/service based on transaction type
    checkRole([Role.ADMIN, Role.STAFF]), // Example: Allow STAFF and ADMIN
    validateRequest(createStockTransactionSchema),
    stockTransactionController.createStockTransactionHandler,
);

// GET /api/v1/stock-transactions - Get transaction history
router.get(
    "/",
    checkRole([Role.ADMIN, Role.STAFF]), // Example: Allow STAFF and ADMIN
    validateRequest(getStockTransactionsSchema),
    stockTransactionController.getStockTransactionsHandler,
);

export default router;
