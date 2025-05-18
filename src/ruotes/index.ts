import express from "express";
import userRoutes from "../modules/user/user.routes";
import companyRoutes from "../modules/company/company.routes";
import subCompanyRoutes from "../modules/subCompany/subCompany.routes";
import taskRoutes from "../modules/task/task.routes";
import chatRoutes from "../modules/chat/chat.routes";
import documentRoutes from "../modules/document/document.routes";
import teamRoutes from "../modules/team/team.routes";
import notificationRoutes from "../modules/notifications/notification.routes";
import authRoutes from "../modules/auth/auth.routes";
import callRuotes from "../modules/call/call.routes";

const router = express.Router();

router.use("/api/users", userRoutes);
router.use("/teams", teamRoutes);
router.use("/api/chats", chatRoutes);
router.use("/auth", authRoutes);
router.use("/api/companies", companyRoutes);
router.use("/api/sub-companies", subCompanyRoutes);
router.use("/api/tasks", taskRoutes);
router.use("/api/documents", documentRoutes);
router.use("/calendar", require("../modules/calendar/calendar.routes").default);
router.use("/api/notifications", notificationRoutes);
router.use("/api/calls", callRuotes);

export default router;
