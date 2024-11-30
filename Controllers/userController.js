const User = require("../Models/userModel");
const catchAsync = require("express-async-handler");
const AppError = require("./../utils/AppError");

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // Check if the users array is empty
  if (users.length === 0) {
    return next(new AppError("No users found", 404)); // Use 404 for "not found" status
  }

  res.status(200).json({
    status: "success",
    result: users.length,
    data: users,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new AppError(`There is not a USER with this id ${req.params.id}`, 402)
    );
  }
  res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError(`No user found with ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
