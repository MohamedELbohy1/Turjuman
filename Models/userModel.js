const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "User Must Have a Name!"],
      minlength: 3,
      maxlength: 32,
      unique: false,
    },
    email: {
      type: String,
      required: [true, "User Must Have an E-Mail!"],
      validate: {
        validator: validator.isEmail,
        message: "Please enter a valid email address!",
      },
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 7,
      maxlength: 17,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please Confirm Your Password!!"],
      validate: {
        validator: function (el) {
          // Only validate if the password is being created or modified
          return this.isModified("password") ? el === this.password : true;
        },
        message: "Passwords are not the same!",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    dailyTranslations: {
      count: { type: Number, default: 0 },
      date: { type: Date, default: Date.now },
    },
    isPremium: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Transform the JSON output to clean up the response

// Encrypt the password with salt (12 rounds) before saving
userSchema.pre("save", async function (next) {
  // This function works only when password is modified
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// Compare passwords during login
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Create the User model
const User = mongoose.model("User", userSchema);

module.exports = User;
