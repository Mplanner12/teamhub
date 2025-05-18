import mongoose, { Schema } from "mongoose";

const teamSchema = new Schema(
  {
    name: { type: String, required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lead: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const TeamModel = mongoose.model("Team", teamSchema);
