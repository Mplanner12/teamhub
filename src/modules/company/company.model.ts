import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  contactEmail: string;
  owner: mongoose.Types.ObjectId;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    contactEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phone: String,
    address: String,
    website: String,
    industry: String,
    logoUrl: String,
  },
  { timestamps: true }
);

export const CompanyModel = mongoose.model<ICompany>("Company", companySchema);
