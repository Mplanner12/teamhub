import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  uploadDocument,
  getCompanyDocuments,
} from "../document/document.controller";
import { upload } from "../../middlewares/upload";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document management
 */

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload a new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The document file to upload.
 *               description:
 *                 type: string
 *                 description: Optional description for the document.
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       400:
 *         description: No file provided or invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Upload failed
 */
router.post("/upload", upload.single("file"), uploadDocument);

/**
 * @swagger
 * /api/documents/:
 *   get:
 *     summary: Get all documents for the authenticated user's company
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized
 */
router.get("/", getCompanyDocuments);

export default router;
