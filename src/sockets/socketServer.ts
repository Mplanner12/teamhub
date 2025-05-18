import { Server } from "socket.io";
import { NotificationModel } from "../modules/notifications/notification.model";
import { MessageModel } from "../modules/chat/chat.model";
import { UserModel } from "../modules/user/user.model";
import mongoose, { Types as MongooseTypes } from "mongoose";

interface SendMessageData {
  receiverId: string;
  text: string;
  companyId: string;
}

interface CreatedMessageDocument extends mongoose.Document {
  _id: MongooseTypes.ObjectId;
  text: string;
  sender: MongooseTypes.ObjectId;
  receiver: MongooseTypes.ObjectId | null; // Match IMessage which allows null for receiver
  companyId: MongooseTypes.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSocketMap = new Map<string, string>();

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userId: string) => {
      (socket as any).userId = userId; // Store userId on the socket for easy access
      userSocketMap.set(userId, socket.id);
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
        }
      }
      console.log("User disconnected:", socket.id);
    });

    socket.on("sendMessage", async (data: SendMessageData) => {
      const senderId = (socket as any).userId;

      if (!senderId) {
        console.error("SendMessage: Sender ID not found on socket.");
        // Optionally emit an error back to the sender
        // socket.emit("sendMessageError", { message: "Authentication error." });
        return;
      }

      try {
        const senderUser = await UserModel.findById(senderId).select(
          "fullName companyId"
        );

        if (!senderUser) {
          console.error("SendMessage: Sender user not found in DB.");
          return;
        }

        // 1. Save the message to MessageModel
        const newMessage = (await MessageModel.create({
          sender: senderId,
          receiver: data.receiverId,
          text: data.text,
          companyId: data.companyId || senderUser.companyId,
        })) as CreatedMessageDocument;

        // 2. Create a persistent notification for the receiver
        if (newMessage && data.receiverId) {
          await NotificationModel.create({
            to: data.receiverId,
            from: senderId,
            type: "chat",
            message: `New message from ${
              senderUser.fullName || "a user"
            }: "${newMessage.text.substring(0, 30)}${
              newMessage.text.length > 30 ? "..." : ""
            }"`,
            data: {
              chatId: senderId.toString(), // Link to chat with the sender
              messageId: newMessage._id.toString(),
              link: `/chat/${senderId}`, // Frontend route to open chat with sender
            },
          });

          // 3. Emit a real-time notification to the receiver
          sendRealtimeNotification(io, data.receiverId.toString(), {
            title: `New message from ${senderUser.fullName || "a user"}`,
            message: `"${newMessage.text.substring(0, 30)}${
              newMessage.text.length > 30 ? "..." : ""
            }"`,
            data: {
              chatId: senderId.toString(),
              messageId: newMessage._id.toString(),
              link: `/chat/${senderId}`,
            },
          });
        }

        // 4. Emit the message to the chat room for both sender and receiver
        io.to(userSocketMap.get(senderId)!).emit("newMessage", newMessage); // To sender
        io.to(userSocketMap.get(data.receiverId)!).emit(
          "newMessage",
          newMessage
        ); // To receiver
      } catch (error) {
        console.error("Error handling sendMessage:", error);
        socket.emit("sendMessageError", { message: "Failed to send message" });
      }
    });
  });
};

// Helper function to emit notification
export const sendRealtimeNotification = (
  io: Server,
  userId: string,
  notification: any
) => {
  const socketId = userSocketMap.get(userId);
  console.log(`Attempting to send real-time notification to userId: ${userId}`); // DEBUG LOG
  if (socketId) {
    io.to(socketId).emit("new-notification", notification);
    console.log(
      `Emitted 'new-notification' to socketId: ${socketId} for userId: ${userId}`
    ); // DEBUG LOG
  } else {
    console.log(
      `No active socket found for userId: ${userId}. Notification not emitted in real-time.`
    ); // DEBUG LOG
  }
};
