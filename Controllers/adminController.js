const savedtransModel = require("../Models/savedtransModel");
const userModel = require("../Models/userModel");
const catchAsync = require("express-async-handler");
const AppError = require("../utils/AppError");
exports.getTopActiveUsers = catchAsync(async (req, res, next) => {
  const topUsers = await savedtransModel.aggregate([
    // Group translations by userId and count the number of translations per user
    { $group: { _id: "$userId", count: { $sum: 1 } } },

    // Sort by the number of translations in descending order
    { $sort: { count: -1 } },

    // Limit to the top 5 users
    { $limit: 5 },

    // Convert _id to ObjectId to ensure it matches the type in users collection
    {
      $addFields: {
        _id: { $toObjectId: "$_id" }, // Ensure _id matches ObjectId in users collection
      },
    },

    // Lookup user details from the userModel
    {
      $lookup: {
        from: "users", // Name of the user collection
        localField: "_id", // userId from savedtransModel
        foreignField: "_id", // _id from userModel
        as: "userDetails",
      },
    },

    // Project the required fields
    {
      $project: {
        count: 1,
        user: {
          name: {
            $ifNull: [{ $arrayElemAt: ["$userDetails.name", 0] }, "Unknown"],
          },
          email: {
            $ifNull: [{ $arrayElemAt: ["$userDetails.email", 0] }, "No Email"],
          },
        },
      },
    },
  ]);

  // Return the top users
  res.status(200).json({
    status: "success",
    data: topUsers,
  });
});

exports.getUsageAnalytics = catchAsync(async (req, res, next) => {
  const totalTranslations = await savedtransModel.countDocuments();

  const activeUsers = await userModel.countDocuments({
    lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0); // Start of today

  const dailyTranslations = await savedtransModel.countDocuments({
    createdAt: { $gte: todayStart },
  });

  res.status(200).json({
    status: "success",
    data: {
      totalTranslations,
      activeUsers,
      dailyTranslations,
    },
  });
});
