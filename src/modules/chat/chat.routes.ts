import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { getChatHistory } from "./chat.controller";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat and messaging
 */

/**
 * @swagger
 * /api/chats/{receiverId}:
 *   get:
 *     summary: Get chat history with a specific user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to fetch chat history with
 *     responses:
 *       200:
 *         description: A list of chat messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessage'
 *       401:
 *         description: Unauthorized
 */
router.get("/:receiverId", getChatHistory);

export default router;
