const User = require("../Models/userModel");
const catchAsync = require("express-async-handler");
const AppError = require("./../utils/AppError");
const ApiFeaturs = require("../utils/ApiFeaturs");
const factory = require("../Controllers/handerController");

// Here we made a middleware to save the current user ID
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteMe = factory.deleteOne(User);
