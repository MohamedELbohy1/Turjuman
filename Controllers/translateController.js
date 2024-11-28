// const dictionary = require("../dictionary.json");
// const savedtransModel = require("../Models/savedtransModel");
// const catchAsync = require("express-async-handler");
// const AppError = require("../utils/AppError");

// exports.translateAndSave = catchAsync(async (req, res, next) => {
//   const { text, fromLang, toLang } = req.body;

//   // Validate inputs
//   if (!text || !fromLang || !toLang) {
//     return next(new AppError("Please provide text, fromLang, and toLang", 400));
//   }

//   const key = `${fromLang}_to_${toLang}`;
//   const translations = dictionary[key];

//   if (!translations) {
//     return next(
//       new AppError(
//         `Translation from ${fromLang} to ${toLang} is not supported`,
//         400
//       )
//     );
//   }

  
//   let result = translations[text.toLowerCase()]; // Direct match
//   if (!result) {
//     result = text
//       .split(" ") // Split text into words by space
//       .map((word) => translations[word.toLowerCase()] || word) // Translate each word or keep it as is
//       .join(" "); // Rejoin translated words into a sentence
//   }

//   // Check if the translation already exists in the database
//   const userId = req.user.id;
//   const existingTranslation = await savedtransModel.findOne({
//     text,
//     fromLang,
//     toLang,
//     userId,
//   });

//   if (existingTranslation) {
//     return res.status(200).json({
//       status: "success",
//       message: "Translation already saved",
//       data: {
//         original: text,
//         translation: existingTranslation.translation,
//       },
//     });
//   }

//   // Save the new translation to the database
//   const savedTrans = await savedtransModel.create({
//     text,
//     fromLang,
//     toLang,
//     translation: result,
//     userId,
//   });

//   // Respond with the translation and saved entry
//   res.status(200).json({
//     status: "success",
//     data: {
//       original: text,
//       translation: result,
//       savedTranslation: savedTrans,
//     },
//   });
// });

// exports.getUserTranslation = catchAsync(async (req, res, next) => {
//   const userId = req.user.id;

//   // Find all saved translations for the logged-in user
//   const savedTrans = await savedtransModel.find({ userId });

//   // Format the response to include original text and its translation
//   const translations = savedTrans.map((trans) => ({
//     originalText: trans.text,
//     translation: trans.translation,
//   }));

//   res.status(200).json({
//     status: "success",
//     data: translations,
//   });
// });
const translate = require("translate-google");
const savedtransModel = require("../Models/savedtransModel");
const catchAsync = require("express-async-handler");
const AppError = require("../utils/AppError");

exports.translateAndSave = catchAsync(async (req, res, next) => {
  const { text, fromLang, toLang } = req.body;

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
    return res.status(200).json({
      status: "success",
      message: "Translation already saved",
      data: {
        original: text,
        translation: existingTranslation.translation,
      },
    });
  }

  // Save the new translation to the database
  const savedTrans = await savedtransModel.create({
    text,
    fromLang,
    toLang,
    translation: result, // Use the result from translate-google
    userId,
  });

  // Respond with the translation and saved entry
  res.status(200).json({
    status: "success",
    data: {
      original: text,
      translation: result,
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
  }));

  res.status(200).json({
    status: "success",
    count: translations.length,
    data: translations,
  });
});