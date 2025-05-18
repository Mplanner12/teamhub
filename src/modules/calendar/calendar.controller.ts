import { Request, Response } from "express";
import { CalendarModel } from "./calendar.model";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { NotificationModel } from "../notifications/notification.model";
import { emitNotification } from "../../utils/notificationEmitter";
import { Server as SocketIOServer } from "socket.io";
import mongoose, { Types as MongooseTypes } from "mongoose";

// Define a type for the created event document
interface CreatedEventDocument extends mongoose.Document {
  _id: MongooseTypes.ObjectId;
  title: string;
  attendees?: MongooseTypes.ObjectId[] | string[];
}

export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const io: SocketIOServer = req.app.get("io");
    const eventData = {
      ...req.body,
      createdBy: req.user!._id,
      companyId: req.user!.companyId,
    };
    const event = (await CalendarModel.create(
      eventData
    )) as CreatedEventDocument;

    // --- Notification Logic for Attendees ---
    if (event && event.attendees && event.attendees.length > 0) {
      const creatorName = req.user!.fullName || "Someone";
      for (const attendeeId of event.attendees) {
        if (attendeeId.toString() === req.user!._id.toString()) continue;

        try {
          await NotificationModel.create({
            to: attendeeId,
            from: req.user!._id,
            type: "calendar",
            message: `${creatorName} invited you to the event: "${event.title}".`,
            data: {
              eventId: event._id.toString(),
              link: `/calendar/${event._id}`,
            },
          });

          emitNotification(io, attendeeId.toString(), {
            title: "New Event Invitation",
            message: `${creatorName} invited you to the event: "${event.title}".`,
            data: {
              eventId: event._id.toString(),
              link: `/calendar/${event._id}`,
            },
          });
        } catch (notificationError) {
          console.error(
            `Failed to send event invitation to ${attendeeId}:`,
            notificationError
          );
        }
      }
    }
    // --- End Notification Logic ---

    res.status(201).json({ message: "Event created", event });
  } catch (err) {
    res.status(500).json({ message: "Failed to create event", err });
  }
};

export const getEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const events = await CalendarModel.find({
      companyId: req.user!.companyId,
    });
    res.status(200).json({ events });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch events", err });
  }
};
