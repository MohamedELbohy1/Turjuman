const translate = require("translate-google");
const savedtransModel = require("../Models/savedtransModel");
const userModel = require("../Models/userModel");
const catchAsync = require("express-async-handler");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");

exports.checkTranslationLimit = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  console.log(`Checking daily limit for user: ${userId}`);

  const user = await userModel.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 401));
  }

  if (!user.dailyTranslations) {
    user.set({
      dailyTranslations: {
        count: 0,
        date: new Date(),
      },
    });
    await user.save({ validateModifiedOnly: true });
  }

  const currentDate = new Date().toISOString().split("T")[0];
  const lastActivityDate = new Date(user.dailyTranslations.date)
    .toISOString()
    .split("T")[0];

  // Reset count if it's a new day
  if (currentDate !== lastActivityDate) {
    user.set({
      dailyTranslations: {
        count: 0,
        date: new Date(),
      },
    });
    await user.save({ validateModifiedOnly: true });
  }

  const dailyLimit = user.isPremium ? 100 : 100; // Example: Premium users get 100 translations; free-tier gets 2
  if (user.dailyTranslations.count >= dailyLimit) {
    return next(
      new AppError(
        `Daily translation limit of ${dailyLimit} reached. Upgrade to premium for more translations.`,
        403
      )
    );
  }

  // Increment count and save
  user.set({
    dailyTranslations: {
      count: user.dailyTranslations.count + 1, // Increment count
      date: user.dailyTranslations.date, // Keep the same date
    },
  });
  await user.save({ validateModifiedOnly: true });

  console.log(`Daily translations updated: ${user.dailyTranslations}`);

  next();
});

exports.translateAndSave = catchAsync(async (req, res, next) => {
  const { text, fromLang, toLang, isFavorite = false } = req.body;

  // Validate inputs
  if (!text || !fromLang || !toLang) {
    return next(new AppError("Please provide text, fromLang, and toLang", 400));
  }

  // Use translate-google to get the translation
  const result = await translate(text, { from: fromLang, to: toLang });

  // Check if the translation already exists in the database
  const userId = req.user.id;
  const existingTranslation = await savedtransModel.findOne({
    text,
    fromLang,
    toLang,
    userId,
  });

  if (existingTranslation) {
    return res.status(409).json({
      status: "success",
      message: "Translation already exists",
      data: {
        original: text,
        translation: existingTranslation.translation,
        isFavorite: existingTranslation.isFavorite,
      },
    });
  }

  // Save the new translation to the databas
  const savedTrans = await savedtransModel.create({
    text,
    fromLang,
    toLang,
    translation: result, // Use the result from translate-google
    userId,
    isFavorite,
  });

  const similarTranslations = await suggestSimilarTranslations(savedTrans);

  // Respond with the translation and saved entry
  res.status(200).json({
    status: "success",
    data: {
      original: text,
      translation: result,
      similarTranslations,
      savedTranslation: savedTrans,
    },
  });
});

exports.getUserTranslation = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Find all saved translations for the logged-in user
  const savedTrans = await savedtransModel.find({ userId });

  // Format the response to include original text and its translation
  const translations = savedTrans.map((trans) => ({
    originalText: trans.text,
    translation: trans.translation,
    fromLang: trans.fromLang,
    toLang: trans.toLang,
    id: trans.id,
  }));

  res.status(200).json({
    status: "success",
    count: translations.length,
    data: translations,
  });
});

exports.getFavorites = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Find all saved translations for the logged-in user with favorites set to true
  const favorites = await savedtransModel.find({ userId, isFavorite: true });

  // Format the response to include original text and its translation
  const favoriteTranslations = favorites.map((trans) => ({
    id: trans.id,
    originalText: trans.text,
    translation: trans.translation,
  }));

  res.status(200).json({
    status: "success",
    count: favoriteTranslations.length,
    data: favoriteTranslations,
  });
});

exports.deleteTranslationById = catchAsync(async (req, res, next) => {
  const deleteTranslation = await savedtransModel.findByIdAndDelete(
    req.params.id
  );

  if (!deleteTranslation) {
    return next(
      new AppError(
        `No Translation Found With This id${req.params.id} To Delete`,
        404
      )
    );
  }

  res.status(200).json({
    status: "success",
    message: "Translation deleted Successfully",
  });
});

exports.getalltranslations = catchAsync(async (req, res, next) => {
  const translations = await savedtransModel.find();

  res.status(200).json({
    status: "success",
    result: translations.length,
    data: {
      translations,
    },
  });
});

const suggestSimilarTranslations = async (newTranslation) => {
  const similarTranslations = await savedtransModel
    .find({
      $text: { $search: newTranslation.text },
      fromLang: newTranslation.fromLang,
      toLang: newTranslation.toLang,
      _id: { $ne: newTranslation._id },
    })
    .select("text translation")
    .limit(5);
  return similarTranslations;
};

//search and filter
exports.searchAndFilterTranslations = catchAsync(async (req, res) => {
  const {
    keyword,
    language,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = req.query;

  // Initialize dynamic query object
  const query = {};

  // Keyword filter
  if (keyword) {
    query.$or = [
      { sourceText: { $regex: keyword, $options: "i" } },
      { translatedText: { $regex: keyword, $options: "i" } },
    ];
  }

  // Language filter
  if (language) {
    query.language = language;
  }

  // Date range filter
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ message: "Invalid startDate format" });
      }
      query.date.$gte = parsedStartDate;
    }
    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ message: "Invalid endDate format" });
      }
      query.date.$lte = parsedEndDate;
    }
  }

  // Pagination parameters
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Fetch translations from the database
  const translations = await savedtransModel
    .find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limitNum);

  // Send response
  res.status(200).json({
    status: "success",
    page: pageNum,
    limit: limitNum,
    count: translations.length,
    data: translations,
  });
});

// exports.addToRecentlyViewed = catchAsync(async (req, res, next) => {
//   const { translationId } = req.body; // ID of the translation being viewed
//   const userId = req.user.id; // ID of the logged-in user

//   // Fetch the user
//   const user = await userModel.findById(userId);

//   if (!user) {
//     return next(new AppError("User not found", 404));
//   }

//   // Add the translation ID to the recently viewed list
//   if (!user.recentlyViewed.includes(translationId)) {
//     user.recentlyViewed.push(translationId);

//     // Limit the array to the last 10 viewed translations
//     if (user.recentlyViewed.length > 10) {
//       user.recentlyViewed.shift(); // Remove the oldest entry
//     }

//     await user.save({ validateModifiedOnly: true });
//   }

//   res.status(200).json({
//     status: "success",
//     message: "Translation added to recently viewed.",
//   });
// });

const getTranslationStats = async (userId) => {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const dailyStats = await savedtransModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startOfDay },
      },
    },
    { $group: { _id: "$toLang", count: { $sum: 1 } } },
    {
      $group: {
        _id: null,
        translations: {
          $push: { toLang: "$_id", count: "$count" },
        },
        dailyTotal: { $sum: "$count" },
      },
    },
  ]);

  const weeklyStats = await savedtransModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId), // Corrected
        createdAt: { $gte: startOfWeek },
      },
    },
    { $group: { _id: "$toLang", count: { $sum: 1 } } },
    {
      $group: {
        _id: null,
        translations: {
          $push: { toLang: "$_id", count: "$count" },
        },
        weeklyTotal: { $sum: "$count" },
      },
    },
  ]);

  const monthlyStats = await savedtransModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId), // Corrected
        createdAt: { $gte: startOfMonth },
      },
    },
    { $group: { _id: "$toLang", count: { $sum: 1 } } },
    {
      $group: {
        _id: null,
        translations: {
          $push: { toLang: "$_id", count: "$count" },
        },
        monthlyTotal: { $sum: "$count" },
      },
    },
  ]);

  const mostSelectedLanguages = await savedtransModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } }, // Corrected
    {
      $group: {
        _id: { fromLang: "$fromLang", toLang: "$toLang" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 2 },
  ]);

  return {
    daily: dailyStats[0] || { translations: [], total: 0 },
    weekly: weeklyStats[0] || { translations: [], total: 0 },
    monthly: monthlyStats[0] || { translations: [], total: 0 },
    mostSelectedLanguages:
      mostSelectedLanguages.length > 0 ? mostSelectedLanguages : [],
  };
};

exports.getTranslationHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const stats = await getTranslationStats(userId);

  res.status(200).json({
    status: "success",
    data: stats,
  });
});
