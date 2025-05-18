import mongoose, { Schema, Document } from "mongoose";

export interface IDocument extends Document {
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileType: string;
  description?: string;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    description: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>(
  "Document",
  documentSchema
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         uploadedBy:
 *           type: string
 *           description: User ID of the uploader
 *         fileName:
 *           type: string
 *         fileUrl:
 *           type: string
 *         fileType:
 *           type: string
 *         description:
 *           type: string
 *         companyId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
