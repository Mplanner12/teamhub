import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId | null;
  groupId?: string;
  text: string;
  attachments?: string[];
  timestamp: Date;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User" },
    groupId: { type: String },
    text: { type: String },
    attachments: [String],
    timestamp: { type: Date, default: Date.now },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<IMessage>("Message", messageSchema);

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         sender:
 *           type: string
 *           description: ID of the sender (User)
 *         receiver:
 *           type: string
 *           description: ID of the receiver (User)
 *         groupId:
 *           type: string
 *         text:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         companyId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
