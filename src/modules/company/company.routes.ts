import express from "express";
import {
  createCompany,
  getAllCompanies,
  updateCompany,
} from "./company.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { roleGuard } from "../../middlewares/role.guard";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management (SuperAdmin only)
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         # Add other company properties here
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/companies/:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Company details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, contactEmail] # Corrected required fields
 *             properties:
 *               name:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 description: Unique contact email for the company.
 *               phone:
 *                 type: string
 *                 description: Optional phone number.
 *               address:
 *                 type: string
 *                 description: Optional company address.
 *               website:
 *                 type: string
 *                 format: url
 *                 description: Optional company website.
 *               industry:
 *                 type: string
 *                 description: Optional industry type.
 *               logoUrl:
 *                 type: string
 *                 format: url
 *                 description: Optional URL for the company logo.
 *     responses:
 *       201:
 *         description: Company created successfully
 *         # content: { application/json: { schema: { $ref: '#/components/schemas/Company' } } }
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 *   get:
 *     summary: Get all companies
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of companies
 *         # content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/Company' } } } }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", roleGuard(["superAdmin"]), createCompany);
router.get("/", roleGuard(["superAdmin", "admin", "member"]), getAllCompanies);

/**
 * @swagger
 * /api/companies/{companyId}:
 *   put:
 *     summary: Update a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the company to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               # Add other updatable company properties
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         # content: { application/json: { schema: { $ref: '#/components/schemas/Company' } } }
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Company not found
 */
router.put("/:companyId", roleGuard(["superAdmin"]), updateCompany);

export default router;
