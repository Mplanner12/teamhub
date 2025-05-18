import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../auth.shcema";
import { sendEmail } from "../../../utils/sendEmail";
import crypto from "crypto";
const JWT_SECRET = process.env.JWT_SECRET!;

export const register = async (userData: any) => {
  const existing = await UserModel.findOne({ email: userData.email });
  if (existing) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser = new UserModel({ ...userData, password: hashedPassword });
  await newUser.save();

  const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
  return { token, user: newUser };
};

export const login = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
  return { token, user };
};

const verificationTokens = new Map();
const resetTokens = new Map();

export const sendVerification = async (email: string) => {
  const token = crypto.randomBytes(32).toString("hex");
  verificationTokens.set(token, email);

  const link = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  await sendEmail(email, "Verify your TeamHub account", `Click: ${link}`);
};

export const verifyEmail = async (token: string) => {
  const email = verificationTokens.get(token);
  if (!email) throw new Error("Invalid or expired verification token");

  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("User not found");

  user.isVerified = true;
  await user.save();
  verificationTokens.delete(token);

  return { message: "Email verified" };
};

export const changeRole = async (userId: string, newRole: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  user.role = newRole as any;
  await user.save();
  return user;
};

export const sendResetPassword = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("User not found");

  const token = crypto.randomBytes(32).toString("hex");
  resetTokens.set(token, user.id.toString());

  const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await sendEmail(email, "Reset your password", `Click to reset: ${link}`);
};

export const resetPassword = async (token: string, newPassword: string) => {
  const userId = resetTokens.get(token);
  if (!userId) throw new Error("Invalid or expired reset token");

  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  resetTokens.delete(token);

  return { message: "Password reset successful" };
};
