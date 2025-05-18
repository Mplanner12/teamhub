import express from "express";
import {
  createSubCompany,
  getSubCompanies,
  assignUsersToSubCompany,
} from "./subCompany.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { roleGuard } from "../../middlewares/role.guard";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: SubCompanies
 *   description: Sub-company management (Admin/SuperAdmin only)
 * components:
 *   schemas:
 *     SubCompany:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         parentCompanyId:
 *           type: string
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
 * /api/sub-companies/:
 *   post:
 *     summary: Create a new sub-company
 *     tags: [SubCompanies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, parentCompanyId]
 *             properties:
 *               name:
 *                 type: string
 *               parentCompanyId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sub-company created successfully
 *         # Define response schema if available, e.g., $ref: '#/components/schemas/SubCompany'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", roleGuard(["superAdmin", "admin"]), createSubCompany);

/**
 * @swagger
 * /api/sub-companies/{parentCompanyId}:
 *   get:
 *     summary: Get sub-companies for a parent company
 *     tags: [SubCompanies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentCompanyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the parent company
 *     responses:
 *       200:
 *         description: A list of sub-companies
 *         # Define response schema if available, e.g., type: array, items: { $ref: '#/components/schemas/SubCompany' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/:parentCompanyId",
  roleGuard(["superAdmin", "admin"]),
  getSubCompanies
);

/**
 * @swagger
 * /api/sub-companies/{subCompanyId}/assign:
 *   put:
 *     summary: Assign users to a sub-company
 *     tags: [SubCompanies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subCompanyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the sub-company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIds]
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Users assigned successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/:subCompanyId/assign",
  roleGuard(["superAdmin", "admin"]),
  assignUsersToSubCompany
);

export default router;
