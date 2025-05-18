import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error("MONGODB_URI not found in environment variables.");
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected...");
  } catch (err: any) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};
