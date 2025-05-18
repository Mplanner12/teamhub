import { Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UserModel } from "../user.model";
import { sendEmail } from "../../../utils/sendEmail";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
};

// ✅ Register new user
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;
    const userExists = await UserModel.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const newUser = await UserModel.create({
      fullName,
      email,
      password,
      verificationToken,
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail(
      email,
      "Welcome to TeamHub! Verify Your Email",
      `
    <h2>Welcome to TeamHub!</h2>
    <p>Thanks for joining our community! We're excited to have you on board.</p>
    <p>To complete your registration, please verify your email address by clicking the link below:</p>
    <p><a href="${verificationUrl}">Verify Email</a></p>
    <p>If you have any issues or concerns, feel free to reply to this email or contact our support team.</p>
    <p>Best regards,</p>
    <p>The TeamHub Team</p>
  `
    );

    res
      .status(201)
      .json({ message: "User registered. Verify your email to continue." });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err });
  }
};

// ✅ Verify email
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;
  const user = await UserModel.findOne({ verificationToken: token });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  res.status(200).json({ message: "Email verified successfully." });
};

// ✅ Login user
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (!user.isVerified)
    return res.status(403).json({ message: "Please verify your email" });

  const token = generateToken(user._id.toString());
  res.status(200).json({ token, user });
};

// ✅ Get all users in company
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await UserModel.find({
      companyId: req.user!.companyId,
    }).select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to get users", error: err });
  }
};

// ✅ Update profile
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const updates = req.body;
    const user = await UserModel.findByIdAndUpdate(req.user!._id, updates, {
      new: true,
    }).select("-password");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err });
  }
};

// ✅ Change user role (admin/superAdmin only)
export const changeUserRole = async (req: Request, res: Response) => {
  const { userId, role } = req.body;
  if (!["admin", "superAdmin", "member"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  );
  res.status(200).json({ message: "User role updated", user });
};

// ✅ Forgot password
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "No user with this email" });

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hr
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendEmail(email, "Reset Password", `Click to reset: ${resetUrl}`);
  res.status(200).json({ message: "Password reset link sent" });
};

// ✅ Reset password
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const user = await UserModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user)
    return res.status(400).json({ message: "Token expired or invalid" });

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password reset successful" });
};
