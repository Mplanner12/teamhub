import { Request, Response, NextFunction } from "express";
import * as teamService from "../services/team.service";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";
import { NotificationModel } from "../../notifications/notification.model";
import { emitNotification } from "../../../utils/notificationEmitter";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";

export const createTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, companyId, lead } = req.body;
    const team = await teamService.createTeam({ name, companyId, lead });
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
};

export const getTeamsByCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;
    const teams = await teamService.getTeamsByCompany(companyId);
    res.status(200).json(teams);
  } catch (err) {
    next(err);
  }
};

export const addMember = async (
  req: AuthenticatedRequest, // Changed to AuthenticatedRequest
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId, userId } = req.body;
    const io: SocketIOServer = req.app.get("io");
    const actor = req.user!; // The user performing the action

    const team = await teamService.addMemberToTeam(teamId, userId);

    // --- Notification Logic ---
    if (team && userId) {
      // Ensure team object has _id and name, adjust if teamService returns differently
      const teamObjectId = team._id || team.id; // Prefer _id if available
      const teamName = team.name || "the team";

      try {
        await NotificationModel.create({
          to: userId, // The user who was added
          from: actor._id, // The user who performed the action
          type: "team",
          message: `You've been added to ${teamName} by ${
            actor.fullName || "an administrator"
          }.`,
          data: {
            teamId: teamObjectId.toString(),
            link: `/teams/${teamObjectId}`,
          },
        });

        emitNotification(io, userId.toString(), {
          title: "Added to Team",
          message: `You've been added to ${teamName} by ${
            actor.fullName || "an administrator"
          }.`,
          data: {
            teamId: teamObjectId.toString(),
            link: `/teams/${teamObjectId}`,
          },
        });
      } catch (notificationError) {
        console.error(
          "Failed to send 'added to team' notification:",
          notificationError
        );
        // Decide if this error should affect the main response
      }
    }
    // --- End Notification Logic ---

    res.status(200).json(team);
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId, userId } = req.body;
    const team = await teamService.removeMemberFromTeam(teamId, userId);
    res.status(200).json(team);
  } catch (err) {
    next(err);
  }
};

export const updateLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId, leadId } = req.body;
    const team = await teamService.updateTeamLead(teamId, leadId);
    res.status(200).json(team);
  } catch (err) {
    next(err);
  }
};
