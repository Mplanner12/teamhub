import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UserModel } from "../../user/user.model";
import { sendEmail } from "../../../utils/sendEmail";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
// Import the InvitationModel (assuming it's created as described above)
import { InvitationModel } from "../../invitation/invitation.model";

const ACCESS_TOKEN_EXPIRES_IN = "15m"; // Short-lived access token
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRES_IN_JWT = "7d";

const generateAccessToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};
const generateRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN_JWT,
  });
};

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, email, password, companyId } = req.body;

    // Check if this is the very first user in the system
    // const existingUserCount = await UserModel.countDocuments();
    let role = "superAdmin";

    // if (existingUserCount === 0) {
    //   role = "superAdmin";
    // } else {
    //   res.status(403).json({
    //     message: "Direct registration is disabled. Users must be invited.",
    //   });
    //   return;
    // }

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
      role,
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

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS
    );
    await user.save({ validateBeforeSave: false });

    const userObject = user.toObject();
    delete userObject.password;

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: REFRESH_TOKEN_EXPIRES_IN_MS,
      })
      .status(200)
      .json({ token: accessToken, user: userObject });
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

export const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const refreshTokenFromCookie = req.cookies.refreshToken;

  if (!refreshTokenFromCookie) {
    res.status(401).json({ message: "Refresh token not found" });
    return;
  }

  try {
    const decoded = jwt.verify(
      refreshTokenFromCookie,
      process.env.JWT_SECRET!
    ) as { id: string; iat: number; exp: number };
    const user = await UserModel.findOne({
      _id: decoded.id,
      refreshToken: refreshTokenFromCookie,
      refreshTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(403).json({ message: "Invalid or expired refresh token." });
      return;
    }

    const newAccessToken = generateAccessToken(user._id.toString());
    res.status(200).json({ token: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired refresh token." });
  }
};

export const logoutController = async (
  req: Request, // Can be AuthenticatedRequest if you need user context for logging
  res: Response,
  next: NextFunction
): Promise<void> => {
  const refreshTokenFromCookie = req.cookies.refreshToken;

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  if (refreshTokenFromCookie) {
    try {
      const decoded = jwt.decode(refreshTokenFromCookie) as {
        id: string;
      } | null; // Decode without verification first
      if (decoded && decoded.id) {
        await UserModel.updateOne(
          { _id: decoded.id, refreshToken: refreshTokenFromCookie },
          { $unset: { refreshToken: 1, refreshTokenExpires: 1 } }
        );
      }
    } catch (error) {
      /* Ignore errors here, main goal is to clear cookie */
    }
  }
  res.status(200).json({ message: "Logged out successfully" });
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

export const inviteUserController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email: emailToInvite, role: roleToAssign } = req.body;
    const invitingUser = req.user!;

    if (!["admin", "member"].includes(roleToAssign)) {
      res
        .status(400)
        .json({ message: "Invalid role specified for invitation." });
      return;
    }

    const existingUser = await UserModel.findOne({ email: emailToInvite });
    if (existingUser) {
      res
        .status(400)
        .json({ message: `User with email ${emailToInvite} already exists.` });
      return;
    }

    const existingInvitation = await InvitationModel.findOne({
      email: emailToInvite,
      status: "pending",
      invitationTokenExpires: { $gt: new Date() },
    });

    if (existingInvitation) {
      res.status(400).json({
        message: `An active invitation already exists for ${emailToInvite}. You can resend it or wait for it to expire.`,
      });
      return;
    }

    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationTokenExpires = new Date(Date.now() + 24 * 3600000);

    await InvitationModel.create({
      email: emailToInvite,
      role: roleToAssign,
      companyId: invitingUser.companyId,
      invitationToken,
      invitationTokenExpires,
      invitedBy: invitingUser._id,
    });

    const acceptInvitationUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${invitationToken}`;

    const htmlContent = `
    <h2>You're Invited to Join TeamHub!</h2>
    <p>You have been invited by ${invitingUser.fullName} to join their team on TeamHub as a(n) ${roleToAssign}.</p>
    <p>To accept this invitation and create your account, please click the link below:</p>
    <p><a href="${acceptInvitationUrl}">Accept Invitation & Create Account</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you have any issues or concerns, please contact ${invitingUser.email}.</p>
    <p>Best regards,</p>
    <p>The TeamHub Team</p>
    `;

    await sendEmail(
      emailToInvite,
      `You're Invited to TeamHub by ${invitingUser.fullName}!`,
      htmlContent
    );

    res.status(200).json({ message: `Invitation sent to ${emailToInvite}.` });
  } catch (error) {
    next(error);
  }
};

export const acceptInvitationController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query as { token: string };
    const { fullName, password } = req.body;

    if (!token) {
      res.status(400).json({ message: "Invitation token is missing." });
      return;
    }

    const invitation = await InvitationModel.findOne({
      invitationToken: token,
      status: "pending",
      invitationTokenExpires: { $gt: new Date() },
    });

    if (!invitation) {
      res.status(400).json({
        message: "Invitation token is invalid, expired, or already used.",
      });
      return;
    }

    const userExists = await UserModel.findOne({ email: invitation.email });
    if (userExists) {
      res
        .status(400)
        .json({ message: "An account with this email already exists." });
      return;
    }

    const newUser = await UserModel.create({
      fullName,
      email: invitation.email,
      password,
      role: invitation.role,
      companyId: invitation.companyId,
      isVerified: true,
    });

    invitation.status = "accepted";
    await invitation.save();

    res.status(201).json({
      message: "Account created successfully from invitation.",
      userId: newUser._id,
    });
  } catch (error) {
    next(error);
  }
};
