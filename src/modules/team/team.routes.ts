import { Router } from "express";
import * as teamController from "./controllers/team.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { roleGuard } from "../../middlewares/role.guard";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Team management
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         companyId:
 *           type: string
 *         lead:
 *           type: string
 *           description: User ID of the team lead
 *         members:
 *           type: array
 *           items:
 *             type: string # User IDs
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /teams/create:
 *   post:
 *     summary: Create a new team (Admin/SuperAdmin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, companyId, lead]
 *             properties:
 *               name:
 *                 type: string
 *               companyId:
 *                 type: string
 *               lead:
 *                 type: string
 *                 description: User ID for the team lead
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/create",
  authenticate,
  roleGuard(["admin", "superAdmin"]),
  teamController.createTeam
);

/**
 * @swagger
 * /teams/company/{companyId}:
 *   get:
 *     summary: Get all teams for a specific company
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the company
 *     responses:
 *       200:
 *         description: A list of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.get(
  "/company/:companyId",
  authenticate,
  teamController.getTeamsByCompany
);

/**
 * @swagger
 * /teams/add-member:
 *   put:
 *     summary: Add a member to a team (Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamId, userId]
 *             properties:
 *               teamId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Team or User not found
 */
router.put(
  "/add-member",
  authenticate,
  roleGuard(["admin"]),
  teamController.addMember
);

/**
 * @swagger
 * /teams/remove-member:
 *   put:
 *     summary: Remove a member from a team (Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamId, userId]
 *             properties:
 *               teamId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Team or User not found
 */
router.put(
  "/remove-member",
  authenticate,
  roleGuard(["admin"]),
  teamController.removeMember
);

/**
 * @swagger
 * /teams/update-lead:
 *   put:
 *     summary: Update the lead of a team (Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamId, leadId]
 *             properties:
 *               teamId:
 *                 type: string
 *               leadId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Team lead updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Team or User not found
 */
router.put(
  "/update-lead",
  authenticate,
  roleGuard(["admin"]),
  teamController.updateLead
);

export default router;
