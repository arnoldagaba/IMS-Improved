import { Router } from "express";
import * as authController from "@/api/controllers/auth.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { loginSchema } from "@/api/validators/auth.validator.ts";

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     description: Authenticates a user and returns a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       '200':
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       '400':
 *         description: Bad Request - Invalid credentials format
 *       '401':
 *         description: Unauthorized - Invalid credentials
 */
router.post("/login", validateRequest(loginSchema), authController.loginHandler);

// Optional: POST /api/v1/auth/register (could point to userController.createUserHandler but without auth)
// Optional: POST /api/v1/auth/refresh-token
// Optional: POST /api/v1/auth/logout

export default router;
