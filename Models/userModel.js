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
        //This only Works on CREATE and SAVE!!
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the Same!!",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

//incryption the password with salt 12
userSchema.pre("save", async function (next) {
  // This function works only when password is modified
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
