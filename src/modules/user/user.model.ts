import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Interface for the User document properties AND custom methods
export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string; // This will be the hashed password
  role: "superAdmin" | "admin" | "member";
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  companyId?: mongoose.Types.ObjectId;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;

  // Declare the instance method
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["superAdmin", "admin", "member"],
      default: "member",
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    avatar: { type: String },
  },
  { timestamps: true }
);

// Pre-save hook for password hashing
userSchema.pre<IUserDocument>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
// Note: We use a regular function here to ensure `this` refers to the document instance
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // `this.password` would be undefined if `select: false` is used and password isn't explicitly selected.
  // Ensure password is selected when finding the user for login.
  // For now, assuming password will be available on `this` or selected in the query.
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
