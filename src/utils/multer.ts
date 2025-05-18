import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Make params a function (can be async or sync)
    return {
      folder: "teamhub/general_uploads",
      resource_type: "auto",
      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "gif", // Common image formats
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt", // Common document formats
        "mp4",
        "mov",
        "avi",
        "wmv", // Common video formats
        "mp3",
        "wav", // Common audio formats
      ],
      // Cloudinary will generate a unique public_id by default
      // To use the original filename (sanitized) as part of the public_id, you could do:
      // public_id: file.originalname.split('.')[0], // Example
    };
  },
});

export const upload = multer({ storage });
