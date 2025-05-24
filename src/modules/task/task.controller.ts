import { Request, Response } from "express";
import { TaskModel } from "./task.model";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { NotificationModel } from "../notifications/notification.model";
import { sendRealtimeNotification } from "../../sockets/socketServer"; // Changed import
import { Server } from "socket.io";
// import cloudinary from "../../utils/cloudinary"; // No longer needed here if multer-storage-cloudinary handles upload
import mongoose, { Types as MongooseTypes } from "mongoose";

interface CreatedTaskDocument extends mongoose.Document {
  _id: MongooseTypes.ObjectId;
  title: string;
}

interface PopulatedUser {
  _id: MongooseTypes.ObjectId;
  fullName?: string;
}

interface TaskForNotification extends mongoose.Document {
  _id: MongooseTypes.ObjectId;
  title: string;
  createdBy: PopulatedUser | MongooseTypes.ObjectId;
  assignedTo?: (PopulatedUser | MongooseTypes.ObjectId)[]; // Corrected to be an array
  status?: string; // For status update notifications
  attachments: string[]; // Add the attachments property
}

export const createTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { title, description, assignedTo, teamId, dueDate, priority } =
    req.body;
  const io: Server = req.app.get("io"); // Get Socket.IO instance from app
  const task = (await TaskModel.create({
    title,
    description,
    assignedTo,
    createdBy: req.user!._id,
    teamId,
    dueDate,
    priority,
    companyId: req.user!.companyId,
  })) as CreatedTaskDocument;

  if (task && assignedTo) {
    try {
      // Create a persistent notification in the database
      await NotificationModel.create({
        to: assignedTo,
        from: req.user!._id,
        type: "task",
        message: `You've been assigned a new task: "${task.title}" by ${
          req.user!.fullName || "the task creator"
        }.`,
        data: { taskId: task._id.toString(), link: `/tasks/${task._id}` },
      });

      // Emit a real-time notification
      sendRealtimeNotification(io, assignedTo.toString(), {
        // Changed function call
        title: "New Task Assigned",
        message: `You've been assigned a new task: "${task.title}" by ${
          req.user!.fullName || "the task creator"
        }.`,
        data: {
          taskId: task._id.toString(),
          link: `/tasks/${task._id}`,
        },
      });
    } catch (error) {
      console.error("Failed to create or emit notification:", error);
      // Decide if this error should affect the response to the client
    }
  }

  res.status(201).json(task);
};

export const getTeamTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { teamId } = req.params;

  const tasks = await TaskModel.find({ teamId })
    .populate("assignedTo", "fullName email")
    .populate("createdBy", "fullName");

  res.status(200).json(tasks);
};

export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { taskId } = req.params;
  const updates = req.body;
  try {
    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, updates, {
      new: true,
    });

    if (!updatedTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the task." });
  }
};
export const updateTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { taskId } = req.params;
  const { status } = req.body;
  const io: Server = req.app.get("io");
  const updater = req.user!;

  const task = (await TaskModel.findByIdAndUpdate(
    taskId,
    { status },
    { new: true }
  )
    .populate("createdBy", "fullName _id")
    .populate("assignedTo", "fullName _id")) as TaskForNotification | null;

  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  // --- Notification Logic ---
  const recipientsToNotify = new Set<string>();
  if (
    task.createdBy &&
    typeof task.createdBy === "object" &&
    task.createdBy._id.toString() !== updater._id.toString()
  ) {
    recipientsToNotify.add(task.createdBy._id.toString());
  }

  // Correctly handle assignedTo as an array
  if (task.assignedTo && Array.isArray(task.assignedTo)) {
    for (const assignee of task.assignedTo) {
      if (assignee) {
        // Ensure assignee is not null/undefined
        const assigneeIdStr =
          typeof assignee === "object" && (assignee as PopulatedUser)._id
            ? (assignee as PopulatedUser)._id.toString()
            : assignee.toString();
        if (assigneeIdStr !== updater._id.toString()) {
          recipientsToNotify.add(assigneeIdStr);
        }
      }
    }
  }

  if (recipientsToNotify.size > 0) {
    const notificationTitle = "Task Status Updated";
    const notificationMessage = `The status of task "${
      task.title
    }" was updated to "${status}" by ${updater.fullName || "a user"}.`;
    const notificationLink = `/tasks/${task._id}`;

    for (const recipientId of recipientsToNotify) {
      try {
        await NotificationModel.create({
          to: recipientId,
          from: updater._id,
          type: "task",
          message: notificationMessage,
          data: {
            taskId: task._id.toString(),
            link: notificationLink,
            status: status,
          },
        });

        sendRealtimeNotification(io, recipientId, {
          // Changed function call
          title: notificationTitle,
          message: notificationMessage,
          data: {
            taskId: task._id.toString(),
            link: notificationLink,
            status: status,
          },
        });
      } catch (notificationError) {
        console.error(
          `Failed to send task status update notification to ${recipientId}:`,
          notificationError
        );
      }
    }
  }
  // --- End Notification Logic ---

  res.status(200).json(task);
};

export const addComment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { taskId } = req.params;
  const { text } = req.body;
  const commenter = req.user!;
  const io: Server = req.app.get("io");

  const task = (await TaskModel.findById(taskId)
    .populate("createdBy", "fullName _id")
    .populate("assignedTo", "fullName _id")) as TaskForNotification | null;

  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return;
  }

  (task as any).comments.push({
    userId: commenter._id,
    text,
    createdAt: new Date(),
  });
  await task.save();

  // --- Notification Logic for New Comment ---
  const recipientsToNotify = new Set<string>();
  if (task.createdBy) {
    const createdByIdString =
      typeof task.createdBy === "object" &&
      (task.createdBy as PopulatedUser)._id
        ? (task.createdBy as PopulatedUser)._id.toString()
        : task.createdBy.toString();

    if (createdByIdString !== commenter._id.toString()) {
      recipientsToNotify.add(createdByIdString);
    }
  }

  if (task.assignedTo && Array.isArray(task.assignedTo)) {
    for (const assignee of task.assignedTo) {
      if (assignee) {
        // Ensure assignee is not null/undefined
        const assigneeIdStr =
          typeof assignee === "object" && (assignee as PopulatedUser)._id
            ? (assignee as PopulatedUser)._id.toString()
            : assignee.toString();

        if (assigneeIdStr !== commenter._id.toString()) {
          recipientsToNotify.add(assigneeIdStr);
        }
      }
    }
  }

  if (recipientsToNotify.size > 0) {
    // The line number 214 from your error message might be around here or within the loop below,
    // depending on exact formatting and comments. The changes above address the ._id.toString() issue.
    const notificationTitle = "New Comment on Task";
    const notificationMessage = `${
      commenter.fullName || "Someone"
    } commented on task "${task.title}": "${text.substring(0, 50)}${
      text.length > 50 ? "..." : ""
    }"`;
    const notificationLink = `/tasks/${task._id}`;

    for (const recipientId of recipientsToNotify) {
      try {
        await NotificationModel.create({
          to: recipientId,
          from: commenter._id,
          type: "task",
          message: notificationMessage,
          data: { taskId: task._id.toString(), link: notificationLink },
        });
        sendRealtimeNotification(io, recipientId, {
          // Changed function call
          title: notificationTitle,
          message: notificationMessage,
          data: {
            taskId: task._id.toString(),
            link: notificationLink,
          },
        });
      } catch (notificationError) {
        console.error(
          `Failed to send new comment notification to ${recipientId}:`,
          notificationError
        );
      }
    }
  }

  res.status(200).json(task);
};

export const uploadAttachment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { taskId } = req.params;
  const file = req.file;
  const uploader = req.user!;
  const io: Server = req.app.get("io");

  if (!file) {
    res.status(400).json({ message: "No file attached" });
    return;
  }
  // When using multer-storage-cloudinary, req.file.path is the Cloudinary URL
  // and req.file.filename is the public_id.
  const uploadedFileUrl = file.path;
  // const cloudinaryPublicId = file.filename; // If you need to store this

  try {
    console.log(`Attempting to add attachment to task ID: ${taskId}`);
    console.log("Uploaded file details from multer:", file);

    if (!uploadedFileUrl) {
      console.error("Multer did not provide a file path (Cloudinary URL).");
      res.status(500).json({
        message:
          "File upload to Cloudinary failed or path not returned by middleware.",
      });
      return;
    }

    const task = (await TaskModel.findById(taskId)
      .populate("createdBy", "fullName _id")
      .populate("assignedTo", "fullName _id")) as TaskForNotification | null;

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    task.attachments.push(uploadedFileUrl);
    await task.save();

    // --- Notification Logic for New Attachment ---
    const recipientsToNotify = new Set<string>();
    if (task.createdBy) {
      // Check if createdBy is populated (an object with _id) or just an ObjectId
      const createdById =
        typeof task.createdBy === "object" && task.createdBy._id
          ? task.createdBy._id.toString()
          : task.createdBy.toString();
      if (createdById !== uploader._id.toString()) {
        recipientsToNotify.add(createdById);
      }
    }
    if (task.assignedTo && Array.isArray(task.assignedTo)) {
      for (const assignee of task.assignedTo) {
        if (assignee) {
          // Ensure assignee is not null/undefined
          const assigneeIdStr =
            typeof assignee === "object" && (assignee as PopulatedUser)._id
              ? (assignee as PopulatedUser)._id.toString()
              : assignee.toString();

          if (assigneeIdStr !== uploader._id.toString()) {
            recipientsToNotify.add(assigneeIdStr);
          }
        }
      }
    }
    if (recipientsToNotify.size > 0) {
      const notificationTitle = "New Attachment on Task";
      const notificationMessage = `${
        uploader.fullName || "Someone"
      } added an attachment to task "${task.title}".`;
      const notificationLink = `/tasks/${task._id}`;

      for (const recipientId of recipientsToNotify) {
        try {
          console.log(
            "Attempting to create notification for recipientId:",
            recipientId
          ); // DEBUG LOG
          await NotificationModel.create({
            to: recipientId,
            from: uploader._id,
            type: "task",
            message: notificationMessage,
            data: {
              taskId: task._id.toString(),
              link: notificationLink,
              fileUrl: uploadedFileUrl, // Use the URL from multer-storage-cloudinary
            },
          });
          sendRealtimeNotification(io, recipientId, {
            // Changed function call
            title: notificationTitle,
            message: notificationMessage,
            data: {
              taskId: task._id.toString(),
              link: notificationLink,
              fileUrl: uploadedFileUrl, // Use the URL from multer-storage-cloudinary
            },
          });
        } catch (notificationError) {
          console.error(
            `Failed to send new attachment notification to ${recipientId}:`,
            notificationError
          );
        }
      }
    }
    // --- End Notification Logic ---

    res.status(200).json({
      message: "File uploaded successfully",
      fileUrl: uploadedFileUrl,
      task,
    });
  } catch (error) {
    // Log the full error object for more details
    console.error("Critical error in uploadAttachment controller:", error);

    // Ensure a JSON response is sent
    // Check if headers have already been sent to avoid 'ERR_HTTP_HEADERS_SENT'
    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to upload attachment",
        errorDetails: error instanceof Error ? error.message : String(error),
      });
    }
  }
};
