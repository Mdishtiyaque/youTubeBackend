import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// ✅ get channel stats
const getChannelStats = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  // Run all aggregation queries in parallel
  const [allLikes, allSubscribes, allVideos, allViews] = await Promise.all([
    Like.aggregate([
      {
        $match: { likedBy: userId }
      },
      {
        $group: {
          _id: null,
          totalVideoLikes: {
            $sum: { $cond: [{ $ifNull: ["$video", false] }, 1, 0] }
          },
          totalTweetLikes: {
            $sum: { $cond: [{ $ifNull: ["$tweet", false] }, 1, 0] }
          },
          totalCommentLikes: {
            $sum: { $cond: [{ $ifNull: ["$comment", false] }, 1, 0] }
          }
        }
      }
    ]),
    Subscription.aggregate([
      {
        $match: { channel: userId }
      },
      {
        $count: "subscribers"
      }
    ]),
    Video.aggregate([
      {
        $match: { owner: userId }
      },
      {
        $count: "Videos"
      }
    ]),
    Video.aggregate([
      {
        $match: { owner: userId }
      },
      {
        $group: {
          _id: null,
          allVideosViews: { $sum: "$views" }
        }
      }
    ])
  ]);

  const stats = {
    subscribers: allSubscribes[0]?.subscribers || 0,
    totalVideos: allVideos[0]?.Videos || 0,
    totalVideoViews: allViews[0]?.allVideosViews || 0,
    totalVideoLikes: allLikes[0]?.totalVideoLikes || 0,
    totalTweetLikes: allLikes[0]?.totalTweetLikes || 0,
    totalCommentLikes: allLikes[0]?.totalCommentLikes || 0
  };

  return res.status(200).json(
    new ApiResponse(200, stats, "Fetching channel stats successfully!")
  );
});

// ✅ get channel videos
const getChannelVideos = asyncHandler(async (req, res) => {
  const allVideos = await Video.find({ owner: req.user._id });

  if (allVideos.length === 0) {
    throw new ApiError(404, "No videos found for this channel.");
  }

  return res.status(200).json(
    new ApiResponse(200, allVideos, "All videos fetched successfully!")
  );
});

export {
  getChannelStats,
  getChannelVideos
};
