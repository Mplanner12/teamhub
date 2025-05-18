import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { NotificationModel } from "../notifications/notification.model";
import mongoose from "mongoose";

export interface MarkAsReadParams {
  id: string;
}

export const getMyNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const notifications = await NotificationModel.find({
      to: req.user!._id, // Using 'to' from INotification
    }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error });
  }
};

export const markAsRead = async (
  req: AuthenticatedRequest<MarkAsReadParams>,
  res: Response
): Promise<void> => {
  try {
    const { id: notificationId } = req.params;
    const userId = req.user!._id;

    // Validate if the notificationId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      res.status(400).json({ message: "Invalid notification ID" });
      return;
    }

    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        to: userId,
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({
        message:
          "Notification not found or you are not authorized to update it",
      });
      return;
    }

    res.status(200).json({ message: "Marked as read", data: notification });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const markAllNotificationsAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    await NotificationModel.updateMany(
      { to: req.user!._id, read: false }, // Using 'to' and 'read' from INotification
      { read: true }
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to mark all notifications as read", error });
  }
};

export const getUnreadNotificationCount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const count = await NotificationModel.countDocuments({
      to: req.user!._id, // Using 'to' from INotification and user from AuthenticatedRequest
      read: false, // Using 'read' from INotification
    });
    res.status(200).json({ count });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get unread notification count", error });
  }
};
