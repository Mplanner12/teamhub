import { Request, Response } from "express";
import cloudinary from "../../utils/cloudinary";
import { DocumentModel } from "./document.model";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { NotificationModel } from "../notifications/notification.model";
import { emitNotification } from "../../utils/notificationEmitter";
import { Server as SocketIOServer } from "socket.io";
import mongoose, { Types as MongooseTypes } from "mongoose";
import axios from "axios";

interface CreatedDocument extends mongoose.Document {
  _id: MongooseTypes.ObjectId;
  fileName: string;
  publicId?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
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
      // It's highly recommended to store the public_id and resource_type
      // returned by Cloudinary in your database for easier deletion later.
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
      publicId: uploadResult.public_id, // Store public ID
      resourceType: resourceType, // Store resource type
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

export const downloadDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { documentId } = req.params;
  const companyId = req.user!.companyId;

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    res.status(400).json({ message: "Invalid document ID format" });
    return;
  }

  try {
    const document = await DocumentModel.findOne({
      _id: documentId,
      companyId: companyId, // Ensure the document belongs to the user's company
    });

    if (!document) {
      res.status(404).json({ message: "Document not found or access denied" });
      return;
    }

    // Assuming document model has fileUrl, fileName, and fileType fields
    const fileUrl = document.get("fileUrl") as string;
    const fileName = document.get("fileName") as string;
    const fileType = document.get("fileType") as string;

    const response = await axios({
      method: "GET",
      url: fileUrl,
      responseType: "stream",
    });

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", fileType || "application/octet-stream"); // Fallback to octet-stream

    response.data.pipe(res);
  } catch (error) {
    console.error("Error downloading document:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "Storage request failed:",
        error.response.status,
        error.response.data
      );
      res.status(502).json({ message: "Failed to fetch file from storage" });
    } else {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ message: "Failed to download document", error: errorMessage });
    }
  }
};

export const deleteDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { documentId } = req.params;
  const companyId = req.user!.companyId;

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    res.status(400).json({ message: "Invalid document ID format" });
    return;
  }

  try {
    // Find the document first to get Cloudinary details and verify ownership
    const document = await DocumentModel.findOne({
      _id: documentId,
      companyId: companyId, // Ensure the document belongs to the user's company
    });

    if (!document) {
      res.status(404).json({ message: "Document not found or access denied" });
      return;
    }

    // Assuming publicId and resourceType are stored in the document model
    const publicId = document.get("publicId") as string | undefined;
    const resourceType = document.get("resourceType") as
      | "image"
      | "video"
      | "raw"
      | "auto"
      | undefined;

    // Delete from Cloudinary if publicId is available
    if (publicId && resourceType) {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } else {
      console.warn(
        `Cloudinary publicId or resourceType missing for document ${documentId}. Skipping Cloudinary deletion.`
      );
    }

    // Delete from MongoDB
    await DocumentModel.deleteOne({ _id: documentId, companyId: companyId });

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Failed to delete document", error });
  }
};
