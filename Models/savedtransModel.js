const mongoose = require("mongoose");

const savedTransSchema = new mongoose.Schema(
  {
    text: {
      type: String,
    },
    translation: {
      type: String,
      required: true,
    },
    fromLang: {
      type: String,
    },
    toLang: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
      select: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    lastActive:{
      type: Date,
      default: Date.now,
      select: false,
      expires: 2592000 // 30 days in seconds (2592000 seconds = 30 days)
    }
  },
  { timestamps: true }
);

const savedtransModel = mongoose.model("savedTrans", savedTransSchema);

module.exports = savedtransModel;
