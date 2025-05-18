import { Router } from "express";
import {
  getMyNotifications,
  markAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from "./notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { MarkAsReadParams } from "./notification.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management
 */

/**
 * @swagger
 * /api/notifications/my:
 *   get:
 *     summary: Retrieve notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of notifications for the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/my", authenticate, getMyNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found or user not authorized
 */
router.patch<MarkAsReadParams>("/:id/read", authenticate, markAsRead);

/**
 * @swagger
 * /api/notifications/mark-all-as-read:
 *   patch:
 *     summary: Mark all unread notifications for the user as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.patch("/mark-all-as-read", authenticate, markAllNotificationsAsRead);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get the count of unread notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count of unread notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/unread-count", authenticate, getUnreadNotificationCount);

export default router;
