import { Router } from "express";
import * as feedController from "./feed.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { roleGuard } from "../../middlewares/role.guard";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Feeds
 *   description: Activity feeds for companies and teams
 * components:
 *   schemas:
 *     FeedActor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *         profilePicture:
 *           type: string
 *           nullable: true
 *     FeedItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         companyId:
 *           type: string
 *         teamId:
 *           type: string
 *           nullable: true
 *         actor:
 *           $ref: '#/components/schemas/FeedActor' # Populated user details
 *         actionType:
 *           type: string
 *           description: Type of action (e.g., 'USER_JOINED_TEAM', 'TASK_CREATED')
 *         message:
 *           type: string
 *           description: Human-readable message for the feed
 *         entityId:
 *           type: string
 *           nullable: true
 *           description: ID of the related entity (e.g., teamId, taskId)
 *         entityType:
 *           type: string
 *           nullable: true
 *           description: Type of the related entity (e.g., 'Team', 'Task')
 *         metadata:
 *           type: object
 *           nullable: true
 *           additionalProperties: true
 *           description: Additional data specific to the action
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateFeedItemPayload:
 *       type: object
 *       required: [companyId, actionType, message]
 *       properties:
 *         companyId: { type: string, description: "ID of the company this feed item belongs to" }
 *         actionType: { type: string, description: "A code for the type of action, e.g., 'SYSTEM_ANNOUNCEMENT'" }
 *         message: { type: string, description: "The content of the feed item" }
 *         teamId: { type: string, nullable: true, description: "Optional ID of a team related to this item" }
 *         entityId: { type: string, nullable: true, description: "Optional ID of an entity (e.g., project, task) related to this item" }
 *         entityType: { type: string, nullable: true, description: "Optional type of the entity (e.g., 'Project', 'Task')" }
 *         metadata: { type: object, additionalProperties: true, nullable: true, description: "Any additional data" }
 */

/**
 * @swagger
 * /feeds/company/{companyId}:
 *   get:
 *     summary: Get activity feed for a specific company
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the company
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/paginationOffset'
 *       - $ref: '#/components/parameters/paginationLastSeenId'
 *     responses:
 *       200:
 *         description: A list of feed items for the company
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FeedItem'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/company/:companyId", authenticate, feedController.getCompanyFeed);

/**
 * @swagger
 * /feeds/company/{companyId}/team/{teamId}:
 *   get:
 *     summary: Get activity feed for a specific team within a company
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the company
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the team
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/paginationOffset'
 *       - $ref: '#/components/parameters/paginationLastSeenId'
 *     responses:
 *       200:
 *         description: A list of feed items for the team
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FeedItem'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/company/:companyId/team/:teamId",
  authenticate,
  feedController.getTeamFeed
);

/**
 * @swagger
 * /feeds:
 *   post:
 *     summary: Create a new feed item directly (e.g., for system announcements)
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFeedItemPayload'
 *     responses:
 *       201:
 *         description: Feed item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeedItem'
 *       400:
 *         description: Invalid input (e.g., missing required fields)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (e.g., trying to post to another company, or role restriction)
 */
router.post(
  "/", // Or consider /company/:companyId/create if companyId should be a path param
  authenticate,
  roleGuard(["admin", "superAdmin"]), // Example: Only admins can post directly
  feedController.createDirectFeedItem
);

/**
 * @swagger
 * /feeds/{feedItemId}/toggle-like:
 *   put:
 *     summary: Like or unlike a feed item
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the feed item to like/unlike
 *     responses:
 *       200:
 *         description: Like status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeedItem' # Returns the updated feed item
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (e.g., user not part of the company)
 *       404:
 *         description: Feed item not found
 */
router.put(
  "/:feedItemId/toggle-like",
  authenticate,
  feedController.toggleLikeOnFeedItem
);

export default router;

// Note: You might want to define common pagination parameters in your Swagger components:
// components:
//   parameters:
//     paginationLimit:
//       name: limit
//       in: query
//       description: Number of items to return
//       schema:
//         type: integer
//         default: 20
//     paginationOffset:
//       name: offset
//       in: query
//       description: Number of items to skip (for offset-based pagination)
//       schema:
//         type: integer
//         default: 0
//     paginationLastSeenId:
//       name: lastSeenId
//       in: query
//       description: ID of the last seen item for cursor-based pagination (overrides offset)
//       schema:
//         type: string
