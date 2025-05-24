import express from "express";
import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} from "./calendar.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Calendar
 *   description: Calendar event management
 */

/**
 * @swagger
 * /calendar/:
 *   post:
 *     summary: Create a new calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startTime
 *               - endTime
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarEvent'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *
 *   get:
 *     summary: Get all calendar events for the authenticated user's company
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of calendar events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CalendarEvent'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /calendar/{eventId}:
 *   put:
 *     summary: Update an existing calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarEvent'
 *       400:
 *         description: Invalid input or invalid event ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user is not creator or admin)
 *       404:
 *         description: Event not found
 *
 *   delete:
 *     summary: Delete a calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event to delete
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       400:
 *         description: Invalid event ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user is not creator or admin)
 *       404:
 *         description: Event not found
 */

router.post("/", createEvent);
router.get("/", getEvents);
router.put("/:eventId", updateEvent);
router.delete("/:eventId", deleteEvent);

export default router;
