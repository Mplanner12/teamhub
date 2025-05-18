import { Server } from "socket.io";

export const emitNotification = (io: Server, userId: string, data: any) => {
  io.to(userId).emit("notification", data);
};
