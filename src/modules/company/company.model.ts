import mongoose, { Schema, Document } from "mongoose";

export interface ICompanyMember {
  user: mongoose.Types.ObjectId;
  role: "admin" | "member";
}
export interface ICompany extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  contactEmail: string;
  owner: mongoose.Types.ObjectId;
  members: ICompanyMember[];
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  logoUrl?: string;
}

const companyMemberSchema = new Schema<ICompanyMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
  },
  { _id: false }
);

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
    members: [companyMemberSchema],
    phone: String,
    address: String,
    website: String,
    industry: String,
    logoUrl: String,
  },
  { timestamps: true }
);

export const CompanyModel = mongoose.model<ICompany>("Company", companySchema);
