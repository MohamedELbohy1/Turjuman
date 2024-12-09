const User = require("../Models/userModel");
const catchAsync = require("express-async-handler");
const AppError = require("./../utils/AppError");
const ApiFeaturs = require("../utils/ApiFeaturs");
const factory = require("../Controllers/handerController");
const bcrypt = require("bcryptjs");

// Here we made a middleware to save the current user ID
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.updateUserPassword = catchAsync(async (req, res, next) => {
  const doc = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
    },
    {
      new: true,
    }
  );
  if (!doc) {
    return next(
      new AppError(`No Document found with this ID ${req.body.password}`, 404)
    );
  }
  res.status(200).json({
    status: "success",
    data: doc,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const doc = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      validateModifiedOnly: true,
    }
  );
  if (!doc) {
    return next(
      new AppError(`No Document found with this ID ${req.body.password}`, 404)
    );
  }
  res.status(200).json({
    status: "success",
    data: doc,
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.deleteMe = factory.deleteOne(User);
