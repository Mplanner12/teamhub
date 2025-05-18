import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  to: mongoose.Types.ObjectId;
  from?: mongoose.Types.ObjectId;
  type: "task" | "calendar" | "chat" | "document" | "team";
  message: string;
  data?: any;
  read: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    from: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["task", "calendar", "chat", "document", "team"],
      required: true,
    },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The notification ID.
 *         to:
 *           type: string
 *           description: The ID of the user who will receive the notification.
 *         from:
 *           type: string
 *           description: The ID of the user who sent the notification (optional).
 *         type:
 *           type: string
 *           enum: [task, calendar, chat, document, team]
 *           description: The type of notification.
 *         message:
 *           type: string
 *           description: The content of the notification.
 *         data:
 *           type: object
 *           description: Additional data related to the notification (e.g., taskId, link).
 *         read:
 *           type: boolean
 *           description: Indicates if the notification has been read.
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the notification was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the notification was last updated.
 */
