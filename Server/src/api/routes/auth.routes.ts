import { Router } from "express";
import * as authController from "@/api/controllers/auth.controller.ts";
import { validateRequest } from "@/api/middleware/validateRequest.ts";
import { loginSchema } from "@/api/validators/auth.validator.ts";
import { requireAuth } from "@/api/middleware/requireAuth.ts";

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

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     description: Obtains a new access token using a valid refresh token (sent via HttpOnly cookie).
 *     # No request body needed if using cookie strategy
 *     responses:
 *       '200':
 *         description: Access token refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 accessToken: { type: string }
 *       '401':
 *         description: Unauthorized - Refresh token missing, invalid, or expired.
 *         content: { $ref: '#/components/responses/UnauthorizedError' }
 *       '500':
 *         description: Internal Server Error.
 *         content: { $ref: '#/components/responses/InternalServerError' }
 */
router.post('/refresh', authController.refreshHandler);


/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log user out
 *     tags: [Authentication]
 *     description: Invalidates the user's refresh token on the server and clears the refresh token cookie. Requires a valid access token.
 *     security:
 *       - BearerAuth: [] # Requires current access token to identify user
 *     responses:
 *       '200':
 *         description: Logout successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       '401':
 *         description: Unauthorized - Access token missing or invalid.
 *         content: { $ref: '#/components/responses/UnauthorizedError' }
 *       '500':
 *         description: Internal Server Error during logout process (client may still be considered logged out).
 *         content: { $ref: '#/components/responses/InternalServerError' } # Or just return 200 OK
 */
router.post('/logout', requireAuth, authController.logoutHandler); // Protect logout route

export default router;
