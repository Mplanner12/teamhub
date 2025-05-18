import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { Server as SocketIOServer } from "socket.io";

// Define an interface for the request body
interface InitiateCallBody {
  toUserId: string;
  type: "video" | "voice";
}

export const initiateCall = async (
  req: AuthenticatedRequest<any, any, InitiateCallBody>,
  res: Response
): Promise<void> => {
  try {
    const { toUserId, type } = req.body;
    const io: SocketIOServer = req.app.get("io");

    // Placeholder for call logic
    const callInfo = {
      from: req.user!._id.toString(), // Assuming req.user has _id
      to: toUserId,
      type,
      status: "initiated",
      startedAt: new Date(),
    };

    io.to(toUserId).emit("incoming-call", callInfo);

    res.status(200).json({ message: `Initiated ${type} call`, call: callInfo });
  } catch (error) {
    console.error("Error initiating call:", error);
    res.status(500).json({ message: "Failed to initiate call", error });
  }
};
