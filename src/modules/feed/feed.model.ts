import mongoose, { Schema, Document } from "mongoose";

export interface IFeedItem extends Document {
  companyId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  actionType: string;
  message: string;
  entityId?: mongoose.Types.ObjectId;
  entityType?: string;
  metadata?: Record<string, any>;
  likes: mongoose.Types.Array<mongoose.Types.ObjectId>; // Use Mongoose's Array type
  likeCount: number; // Changed from likesCount and made non-optional
  createdAt: Date;
  updatedAt: Date;
}

const feedSchema = new Schema<IFeedItem>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actionType: { type: String, required: true },
    message: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    entityType: { type: String },
    metadata: { type: Schema.Types.Mixed },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }], // Added default
    likeCount: { type: Number, default: 0, index: true }, // Changed from likesCount and added index
  },
  { timestamps: true }
);

feedSchema.index({ companyId: 1, createdAt: -1 });
feedSchema.index({ companyId: 1, teamId: 1, createdAt: -1 });

export const FeedModel = mongoose.model<IFeedItem>("FeedItem", feedSchema);
