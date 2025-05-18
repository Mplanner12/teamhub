import { Request, Response } from "express";
import { MessageModel } from "./chat.model";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export const getChatHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { receiverId } = req.params;

  const messages = await MessageModel.find({
    companyId: req.user!.companyId,
    $or: [
      { sender: req.user!._id, receiver: receiverId },
      { sender: receiverId, receiver: req.user!._id },
    ],
  }).sort({ createdAt: 1 });

  res.status(200).json(messages);
};
