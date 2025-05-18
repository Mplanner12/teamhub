import express from "express";
import { initiateCall } from "./controllers/call.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = express.Router();

// All call routes should be protected
/**
 * @swagger
 * tags:
 *   name: Calls
 *   description: Call management
 */

/**
 * @swagger
 * /api/calls/initiate:
 *   post:
 *     summary: Initiate a voice or video call
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toUserId
 *               - type
 *             properties:
 *               toUserId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [video, voice]
 *     responses:
 *       200:
 *         description: Call initiated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.post("/initiate", authenticate, initiateCall);

export default router;
