import { Request, Response } from "express";
import cloudinary from "../../utils/cloudinary";
import { DocumentModel } from "./document.model";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { NotificationModel } from "../notifications/notification.model";
import { emitNotification } from "../../utils/notificationEmitter";
import { Server as SocketIOServer } from "socket.io";
import mongoose, { Types as MongooseTypes } from "mongoose";

interface CreatedDocument extends mongoose.Document {
  _id: MongooseTypes.ObjectId;
  fileName: string;
}
export const uploadDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const file = req.file;
  const { description } = req.body;
  const io: SocketIOServer = req.app.get("io");

  if (!file) {
    res.status(400).json({ message: "No file provided" });
    return;
  }

  try {
    const b64 = Buffer.from(file.buffer).toString("base64");
    let dataURI = "data:" + file.mimetype + ";base64," + b64;

    // Determine resource_type and format for Cloudinary
    let resourceType: "image" | "video" | "raw" | "auto" = "auto";
    const fileExtension = file.originalname.split(".").pop()?.toLowerCase();

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else {
      resourceType = "raw"; // For documents, pdf, etc.
    }

    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "teamhub/documents",
      resource_type: resourceType,
      format: fileExtension, // Provide the file extension as format for raw files
    });

    if (!uploadResult || !uploadResult.secure_url) {
      res
        .status(500)
        .json({ message: "Cloudinary upload failed, no result URL" });
      return;
    }

    const newDoc = (await DocumentModel.create({
      uploadedBy: req.user!._id,
      fileName: file.originalname, // Use the original filename
      fileUrl: uploadResult.secure_url,
      fileType: file.mimetype,
      description,
      companyId: req.user!.companyId,
    })) as CreatedDocument;

    // --- Notification Logic ---
    if (newDoc) {
      try {
        await NotificationModel.create({
          to: req.user!._id,
          from: req.user!._id,
          type: "document",
          message: `Your document "${newDoc.fileName}" was successfully uploaded.`,
          data: {
            documentId: newDoc._id.toString(),
            link: `/documents/${newDoc._id}`,
          },
        });

        emitNotification(io, req.user!._id.toString(), {
          title: "Document Uploaded",
          message: `Your document "${newDoc.fileName}" was successfully uploaded.`,
          data: {
            documentId: newDoc._id.toString(),
            link: `/documents/${newDoc._id}`,
          },
        });
      } catch (notificationError) {
        console.error(
          "Failed to send document upload notification:",
          notificationError
        );
      }
    }
    // --- End Notification Logic ---

    res.status(201).json(newDoc);
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Failed to upload document", error });
  }
};

export const getCompanyDocuments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const documents = await DocumentModel.find({ companyId: req.user!.companyId }) // Assuming user is guaranteed
    .sort({ createdAt: -1 })
    .populate("uploadedBy", "fullName email");
  res.status(200).json(documents);
  // No explicit return needed here
};
