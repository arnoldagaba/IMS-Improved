import { Router } from "express";
import * as authController from "@/api/controllers/auth.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { loginSchema } from "@/api/validators/auth.validator.ts";

const router = Router();

// POST /api/v1/auth/login
router.post("/login", validateRequest(loginSchema), authController.loginHandler);

// Optional: POST /api/v1/auth/register (could point to userController.createUserHandler but without auth)
// Optional: POST /api/v1/auth/refresh-token
// Optional: POST /api/v1/auth/logout

export default router;
