import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string; // Keep as optional
  assignedTo: mongoose.Types.ObjectId[]; // Already an array, good
  createdBy: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId; // Keep as required
  status: "To Do" | "In Progress" | "Done";
  dueDate?: Date;
  priority: "Low" | "Medium" | "High";
  attachments: string[];
  comments: {
    userId: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
  companyId: mongoose.Types.ObjectId; // Added companyId to interface
  // createdAt and updatedAt will be added by Mongoose Document extension
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Done"],
      default: "To Do",
    },
    dueDate: { type: Date },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    attachments: [String],
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true }, // Added companyId to schema
  },
  { timestamps: true }
);

export const TaskModel = mongoose.model<ITask>("Task", taskSchema);

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         assignedTo:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of User IDs assigned to the task
 *         createdBy:
 *           type: string
 *           description: User ID of the task creator
 *         teamId:
 *           type: string
 *           description: ID of the team this task belongs to
 *         status:
 *           type: string
 *           enum: ["To Do", "In Progress", "Done"]
 *         dueDate:
 *           type: string
 *           format: date-time
 *         priority:
 *           type: string
 *           enum: ["Low", "Medium", "High"]
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *             description: URLs of attachments
 *         comments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               text:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *         companyId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
