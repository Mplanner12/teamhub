import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UserModel } from "../../user/user.model";
import { sendEmail } from "../../../utils/sendEmail";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
};

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, email, password, companyId } = req.body;
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const newUser = await UserModel.create({
      fullName,
      email,
      password,
      companyId,
      verificationToken,
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const htmlContent = `
    <h2>Welcome to TeamHub!</h2>
    <p>Thanks for joining our community! We're excited to have you on board.</p>
    <p>To complete your registration, please verify your email address by clicking the link below:</p>
    <p><a href="${verificationUrl}">Verify Email</a></p>
    <p>If you have any issues or concerns, feel free to reply to this email or contact our support team.</p>
    <p>Best regards,</p>
    <p>The TeamHub Team</p>
    `;

    const plainTextContent = `
Welcome to TeamHub!

Thanks for joining our community! We're excited to have you on board.

To complete your registration, please verify your email address by visiting the link below:

${verificationUrl}

If you have any issues or concerns, feel free to reply to this email or contact our support team.

Best regards,
The TeamHub Team
    `;

    await sendEmail(
      email,
      "Welcome to TeamHub! Verify Your Email",
      htmlContent,
      plainTextContent
    );

    res
      .status(201)
      .json({ message: "User registered. Verify your email to continue." });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ message: "Please verify your email" });
      return;
    }

    const token = generateToken(user._id.toString());
    // Exclude password from the returned user object
    const userObject = user.toObject();
    delete userObject.password;
    res.status(200).json({ token, user: userObject });
  } catch (error) {
    next(error);
  }
};

export const verifyEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params; // Corrected to req.params based on route definition
    const user = await UserModel.findOne({
      verificationToken: token as string,
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    next(error);
  }
};

export const changeRoleController = async (
  req: AuthenticatedRequest, // Use AuthenticatedRequest if admin performing this needs to be identified
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, newRole } = req.body;
    if (!["admin", "superAdmin", "member"].includes(newRole)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    ).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ message: "User role updated", user });
  } catch (error) {
    next(error);
  }
};

export const sendResetController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      // Still send a 200 to prevent email enumeration
      res.status(200).json({
        message:
          "If a user with that email exists, a password reset link has been sent.",
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hr
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const htmlContent = `
    <h2>Reset Your TeamHub Password</h2>
    <p>You requested to reset your password.</p>
    <p>Please click the link below to set a new password:</p>
    <p><a href="${resetUrl}">Reset Password</a></p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,</p>
    <p>The TeamHub Team</p>
    `;

    await sendEmail(email, "Reset Your TeamHub Password", htmlContent);
    res.status(200).json({ message: "Password reset link sent." });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      res.status(400).json({ message: "Token expired or invalid" });
      return;
    }

    user.password = newPassword; // The pre-save hook in UserModel will hash this
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    next(error);
  }
};

// sendVerifyEmailController is effectively covered by registerController now.
// If you need a separate endpoint to resend verification, we can add that.
