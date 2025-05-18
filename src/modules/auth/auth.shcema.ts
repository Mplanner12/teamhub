// src/modules/auth/auth.schema.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  avatar?: string;
  role: "superAdmin" | "admin" | "member";
  companyId?: mongoose.Types.ObjectId;
  isVerified: boolean;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    role: {
      type: String,
      enum: ["superAdmin", "admin", "member"],
      default: "member",
    },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
