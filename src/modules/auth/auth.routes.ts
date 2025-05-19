import { Router } from "express";
import {
  registerController,
  loginController,
} from "./controllers/auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { roleGuard } from "../../middlewares/role.guard"; // Changed to roleGuard for consistency
import {
  verifyEmailController,
  changeRoleController,
  sendResetController,
  resetPasswordController,
  inviteUserController, // Added
  acceptInvitationController, // Added
} from "./controllers/auth.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration' # Assuming UserRegistration is defined elsewhere or in user.routes.ts
 *     responses:
 *       201:
 *         description: User registered successfully. Verification email sent.
 *       400:
 *         description: Invalid input or user already exists
 */
router.post("/register", registerController);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials' # Assuming LoginCredentials is defined elsewhere or in user.routes.ts
 *     responses:
 *       200:
 *         description: Login successful, returns user and token
 *         # Define response schema with token and user
 *       400:
 *         description: Invalid credentials or user not verified
 */
router.post("/login", loginController);

/**
 * @swagger
 * /auth/verify/{token}:
 *   get:
 *     summary: Verify user's email address using a token from the email link
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get("/verify/:token", verifyEmailController);

/**
 * @swagger
 * /auth/change-role:
 *   post:
 *     summary: Change a user's role (Admin/SuperAdmin only) - Duplicates user.routes.ts endpoint
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, newRole]
 *             properties:
 *               userId:
 *                 type: string
 *               newRole:
 *                 type: string
 *                 enum: [user, admin, superAdmin]
 *     responses:
 *       200:
 *         description: User role changed successfully
 *       400:
 *         description: Invalid input or invalid role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.post(
  "/change-role",
  authenticate,
  roleGuard(["admin", "superAdmin"]), // Using roleGuard
  changeRoleController
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send a password reset link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent if user exists
 *       400:
 *         description: Invalid email format
 */
router.post("/forgot-password", sendResetController);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user's password using a token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or password format
 */
router.post("/reset-password", resetPasswordController);

/**
 * @swagger
 * /auth/invite-user:
 *   post:
 *     summary: Invite a new user (SuperAdmin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, member] # Roles superAdmin can invite
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 *       400:
 *         description: Invalid input, user already exists, or invalid role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a superAdmin)
 */
router.post(
  "/invite-user",
  authenticate,
  roleGuard(["superAdmin"]),
  inviteUserController
);

// This route would typically be hit by a user clicking a link from an email
// The frontend would then make a POST request to this endpoint with the token and user details
router.post("/accept-invitation", acceptInvitationController);

export default router;
