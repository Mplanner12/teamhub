import mongoose, { Document, Schema } from "mongoose";

export interface IInvitation extends Document {
  email: string;
  role: "admin" | "member";
  companyId: mongoose.Types.ObjectId;
  invitationToken: string;
  invitationTokenExpires: Date;
  status: "pending" | "accepted" | "expired";
  invitedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema: Schema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, required: true, enum: ["admin", "member"] },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    invitationToken: { type: String, required: true, unique: true },
    invitationTokenExpires: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

InvitationSchema.index({ invitationToken: 1, status: 1 });
InvitationSchema.index({ email: 1, status: 1 });

export const InvitationModel = mongoose.model<IInvitation>(
  "Invitation",
  InvitationSchema
);
