import { Response, NextFunction } from "express";
import * as feedService from "./feed.service";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { Types } from "mongoose";

export const getCompanyFeed = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyIdFromParams = req.params.companyId;
    const userCompanyId = req.user?.companyId;

    if (!userCompanyId || userCompanyId.toString() !== companyIdFromParams) {
      res
        .status(403)
        .json({ message: "Forbidden: Access denied to this company's feed." });
    } else {
    }

    const { limit, offset, lastSeenId } = req.query;

    const feedItems = await feedService.getFeedItems({
      companyId: companyIdFromParams,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      lastSeenId: lastSeenId as string | undefined,
    });

    res.status(200).json(feedItems);
  } catch (err) {
    next(err);
  }
};

export const getTeamFeed = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId: companyIdFromParams, teamId } = req.params;
    const userCompanyId = req.user?.companyId;
    // const userTeams = req.user?.teams; // Future: check if user is part of the team

    if (!userCompanyId || userCompanyId.toString() !== companyIdFromParams) {
      // Added return to stop execution
      res
        .status(403)
        .json({ message: "Forbidden: Access denied to this company's feed." });
    } else {
      // Continue if authorized
    }

    // Add further checks if user must be part of the team to see its feed.
    // For example, check if teamId is in userTeams.

    const { limit, offset, lastSeenId } = req.query;

    const feedItems = await feedService.getFeedItems({
      companyId: companyIdFromParams,
      teamId,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      lastSeenId: lastSeenId as string | undefined,
    });

    res.status(200).json(feedItems);
  } catch (err) {
    next(err);
  }
};

export const createDirectFeedItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      companyId,
      actionType,
      message,
      teamId,
      entityId,
      entityType,
      metadata,
    } = req.body;
    const actor = req.user!;

    if (!actor.companyId || actor.companyId.toString() !== companyId) {
      res.status(403).json({
        message:
          "Forbidden: You can only create feed items for your own company.",
      });
      return; // Ensure function exits
    }

    if (!actionType || !message) {
      res.status(400).json({ message: "ActionType and message are required." });
    }

    const feedItemData: feedService.CreateFeedItemDTO = {
      companyId,
      actor: actor._id,
      actionType,
      message,
      teamId: teamId ? new Types.ObjectId(teamId) : undefined,
      entityId: entityId ? new Types.ObjectId(entityId) : undefined,
      entityType,
      metadata,
    };

    const newFeedItem = await feedService.createFeedItem(feedItemData);
    res.status(201).json(newFeedItem);
  } catch (err) {
    next(err);
  }
};

export const toggleLikeOnFeedItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { feedItemId } = req.params;
    const user = req.user!;

    if (!user.companyId) {
      res
        .status(403)
        .json({ message: "Forbidden: Company information missing." });
      return; // Ensure function exits
    }

    const updatedFeedItem = await feedService.toggleLikeFeedItem(
      feedItemId,
      user._id,
      user.companyId! // Assert companyId is present due to the check above
    );

    if (!updatedFeedItem) {
      res
        .status(404)
        .json({ message: "Feed item not found or access denied." });
    }
    res.status(200).json(updatedFeedItem);
  } catch (err) {
    next(err);
  }
};
