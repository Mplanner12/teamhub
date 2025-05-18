import mongoose, { Schema, Document } from "mongoose";

export interface ISubCompany extends Document {
  name: string;
  parentCompanyId: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
}

const subCompanySchema = new Schema<ISubCompany>(
  {
    name: { type: String, required: true },
    parentCompanyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const SubCompanyModel = mongoose.model<ISubCompany>(
  "SubCompany",
  subCompanySchema
);
