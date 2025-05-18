import { Server as SocketIOServer } from "socket.io";

interface NotificationPayload {
  title: string;
  message: string;
  link?: string;
  [key: string]: any;
}

export const emitNotification = (
  io: SocketIOServer,
  userId: string,
  payload: NotificationPayload
): void => {
  io.to(userId).emit("new_notification", payload);
  console.log(`Emitted notification to user ${userId}:`, payload);
};
