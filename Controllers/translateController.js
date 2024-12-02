const translate = require("translate-google");
const savedtransModel = require("../Models/savedtransModel");
const userModel = require("../Models/userModel");
const catchAsync = require("express-async-handler");
const AppError = require("../utils/AppError");

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

  const dailyLimit = user.isPremium ? 100 : 10; // Example: Premium users get 100 translations; free-tier gets 2
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
