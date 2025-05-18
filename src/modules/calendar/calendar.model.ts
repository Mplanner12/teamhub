import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICalendarEvent extends Document {
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date; // Made endTime optional to match schema
  companyId?: Types.ObjectId; // Made companyId optional to match schema
  createdBy?: Types.ObjectId; // Made createdBy optional to match schema
  attendees?: Types.ObjectId[]; // Added attendees
  reminderBefore?: number;
  // createdAt and updatedAt will be added by Mongoose Document extension
}

const calendarSchema = new Schema<ICalendarEvent>(
  {
    title: { type: String, required: true },
    description: String,
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    attendees: [{ type: Schema.Types.ObjectId, ref: "User" }], // Added attendees to schema
    reminderBefore: { type: Number }, // in minutes
  },
  { timestamps: true }
);

export const CalendarModel = mongoose.model<ICalendarEvent>(
  "CalendarEvent", // Changed model name for clarity, ensure consistency if used elsewhere
  calendarSchema
);

/**
 * @swagger
 * components:
 *   schemas:
 *     CalendarEvent:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         attendees:
 *           type: array
 *           items:
 *             type: string
 *         createdBy:
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
