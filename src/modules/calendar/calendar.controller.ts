import { Request, Response } from "express";
import { CalendarModel } from "./calendar.model";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { NotificationModel } from "../notifications/notification.model";
import { emitNotification } from "../../utils/notificationEmitter";
import { Server as SocketIOServer } from "socket.io";
import mongoose, { Types as MongooseTypes, isValidObjectId } from "mongoose";

interface ICalendarEvent extends mongoose.Document {
  _id: MongooseTypes.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: MongooseTypes.ObjectId[];
  createdBy: MongooseTypes.ObjectId;
  companyId: MongooseTypes.ObjectId;
}

export const createEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const io: SocketIOServer = req.app.get("io");
    const eventData = {
      ...req.body,
      createdBy: req.user!._id,
      companyId: req.user!.companyId,
    };
    const event = (await CalendarModel.create(eventData)) as ICalendarEvent;

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
    return;
  } catch (err) {
    res.status(500).json({ message: "Failed to create event", err });
    return;
  }
};

export const getEvents = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const events = await CalendarModel.find({
      companyId: req.user!.companyId,
    });
    res.status(200).json({ events });
    return;
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch events", err });
    return;
  }
};

export const updateEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { eventId } = req.params;
  const eventDataToUpdate = req.body;

  if (!isValidObjectId(eventId)) {
    res.status(400).json({ message: "Invalid event ID" });
    return;
  }

  try {
    const event = (await CalendarModel.findById(
      eventId
    )) as ICalendarEvent | null;

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Authorization: Must be creator or admin
    // Assuming req.user.companyRole exists and 'admin' is a valid role.
    // Adjust req.user!.companyRole === "admin" if your admin check is different.
    const isAdmin = req.user!.companyRole === "admin";
    const isCreator = event.createdBy.toString() === req.user!._id.toString();

    if (!isCreator && !isAdmin) {
      res.status(403).json({ message: "Not authorized to update this event" });
      return;
    }

    const originalAttendeeIds =
      event.attendees?.map((id) => id.toString()) || [];

    // Update event fields
    Object.keys(eventDataToUpdate).forEach((key) => {
      (event as any)[key] = eventDataToUpdate[key];
    });
    const updatedEvent = (await event.save()) as ICalendarEvent;

    // --- Notification Logic for Update ---
    const io: SocketIOServer = req.app.get("io");
    const creatorName = req.user!.fullName || "Someone";
    const significantFields = ["title", "description", "startTime", "endTime"];
    const significantDetailsChanged = significantFields.some(
      (key) => key in eventDataToUpdate
    );

    if (updatedEvent.attendees && updatedEvent.attendees.length > 0) {
      for (const attendeeIdObj of updatedEvent.attendees) {
        const attendeeId = attendeeIdObj.toString();
        if (attendeeId === req.user!._id.toString()) continue;

        const isNewAttendee =
          eventDataToUpdate.attendees &&
          !originalAttendeeIds.includes(attendeeId);

        try {
          if (isNewAttendee) {
            await NotificationModel.create({
              to: attendeeIdObj,
              from: req.user!._id,
              type: "calendar",
              message: `${creatorName} invited you to the event: "${updatedEvent.title}".`,
              data: {
                eventId: updatedEvent._id.toString(),
                link: `/calendar/${updatedEvent._id}`,
              },
            });
            emitNotification(io, attendeeId, {
              title: "New Event Invitation",
              message: `${creatorName} invited you to the event: "${updatedEvent.title}".`,
              data: {
                eventId: updatedEvent._id.toString(),
                link: `/calendar/${updatedEvent._id}`,
              },
            });
          } else if (
            originalAttendeeIds.includes(attendeeId) &&
            significantDetailsChanged
          ) {
            // Notify existing attendees if significant details changed
            await NotificationModel.create({
              to: attendeeIdObj,
              from: req.user!._id,
              type: "calendar_update",
              message: `${creatorName} updated the event: "${updatedEvent.title}".`,
              data: {
                eventId: updatedEvent._id.toString(),
                link: `/calendar/${updatedEvent._id}`,
              },
            });
            emitNotification(io, attendeeId, {
              title: "Event Updated",
              message: `${creatorName} updated the event: "${updatedEvent.title}".`,
              data: {
                eventId: updatedEvent._id.toString(),
                link: `/calendar/${updatedEvent._id}`,
              },
            });
          }
        } catch (notificationError) {
          console.error(
            `Failed to send event update notification to ${attendeeId}:`,
            notificationError
          );
        }
      }
    }
    // --- End Notification Logic ---

    res.status(200).json({ message: "Event updated", event: updatedEvent });
    return;
  } catch (err) {
    res.status(500).json({ message: "Failed to update event", err });
    return;
  }
};

export const deleteEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { eventId } = req.params;

  if (!isValidObjectId(eventId)) {
    res.status(400).json({ message: "Invalid event ID" });
    return;
  }

  try {
    const event = (await CalendarModel.findById(
      eventId
    )) as ICalendarEvent | null;
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Authorization: Must be creator or admin
    // Assuming req.user.companyRole exists. Adjust if your admin check is different.
    const isAdmin = req.user!.companyRole === "admin";
    const isCreator = event.createdBy.toString() === req.user!._id.toString();

    if (!isCreator && !isAdmin) {
      res.status(403).json({ message: "Not authorized to delete this event" });
      return;
    }

    await CalendarModel.findByIdAndDelete(eventId);
    res.status(200).json({ message: "Event deleted successfully" });
    return;
  } catch (err) {
    res.status(500).json({ message: "Failed to delete event", err });
    return;
  }
};
