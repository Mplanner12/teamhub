import { FeedModel, IFeedItem } from "./feed.model";
import { Types } from "mongoose";

export interface CreateFeedItemDTO {
  companyId: string | Types.ObjectId;
  actor: string | Types.ObjectId;
  actionType: string;
  message: string;
  teamId?: string | Types.ObjectId;
  entityId?: string | Types.ObjectId;
  entityType?: string;
  metadata?: Record<string, any>;
}

export const createFeedItem = async (
  data: CreateFeedItemDTO
): Promise<IFeedItem> => {
  return await FeedModel.create(data);
};

export interface GetFeedItemsQuery {
  companyId: string | Types.ObjectId;
  teamId?: string | Types.ObjectId;
  limit?: number;
  offset?: number; // For offset-based pagination
  lastSeenId?: string; // For cursor-based pagination (ID of the last item seen)
}

export const getFeedItems = async ({
  companyId,
  teamId,
  limit = 20,
  offset = 0,
  lastSeenId,
}: GetFeedItemsQuery): Promise<IFeedItem[]> => {
  const query: any = { companyId };
  if (teamId) {
    query.teamId = teamId;
  }

  if (lastSeenId) {
    const lastItem = await FeedModel.findById(lastSeenId)
      .select("createdAt _id")
      .lean();
    if (lastItem) {
      query.$or = [
        { createdAt: { $lt: lastItem.createdAt } },
        { createdAt: lastItem.createdAt, _id: { $lt: lastItem._id } },
      ];
    }
  }

  const feedQuery = FeedModel.find(query)
    .populate("actor", "fullName email profilePicture")
    .sort({ createdAt: -1, _id: -1 }) // Ensure consistent sort for cursor pagination
    .limit(limit);

  if (!lastSeenId && offset > 0) {
    feedQuery.skip(offset);
  }

  return await feedQuery.exec();
};

export const toggleLikeFeedItem = async (
  feedItemId: string,
  userId: string | Types.ObjectId,
  userCompanyId: string | Types.ObjectId
): Promise<IFeedItem | null> => {
  const feedItem = await FeedModel.findById(feedItemId);

  if (!feedItem) {
    return null; // Or throw an error: throw new Error("Feed item not found");
  }

  // Authorization: Ensure the feed item belongs to the user's company
  if (feedItem.companyId.toString() !== userCompanyId.toString()) {
    // This check is more of a safeguard; primary auth should be in controller/middleware
    throw new Error("Forbidden: Cannot interact with this feed item.");
  }

  const userIdObj = new Types.ObjectId(userId);
  const alreadyLiked = feedItem?.likes?.some((likerId) =>
    likerId.equals(userIdObj)
  );

  if (alreadyLiked) {
    feedItem.likes.pull(userIdObj);
  } else {
    feedItem.likes.addToSet(userIdObj); // addToSet prevents duplicates
  }
  feedItem.likeCount = feedItem.likes.length;
  return await feedItem.save();
};
