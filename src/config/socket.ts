import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { MessageModel } from "../modules/chat/chat.model";

interface CustomSocket extends Socket {
  user?: any;
}

export const socketHandler = (io: Server) => {
  io.use((socket: CustomSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (!decoded) return next(new Error("Invalid token"));
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: CustomSocket) => {
    const user = socket.user;
    console.log(`User connected: ${user.email}`);

    // Join company or sub-company room
    socket.join(user.companyId);

    // 💬 Chat send & receive
    socket.on("chat:send", async (data) => {
      const { text, receiver, groupId, attachments } = data;

      const message = await MessageModel.create({
        sender: user.id,
        receiver,
        groupId,
        text,
        attachments,
        companyId: user.companyId,
      });

      io.to(user.companyId).emit("chat:receive", {
        ...message.toObject(),
        sender: {
          _id: user.id,
          fullName: user.fullName,
          avatar: user.avatar,
        },
      });
    });

    // 📞 Call events (placeholder)
    socket.on("call:initiate", (data) => {
      io.to(user.companyId).emit("call:incoming", data);
    });

    socket.on("call:end", (data) => {
      io.to(user.companyId).emit("call:ended", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", user.email);
    });
  });
};
