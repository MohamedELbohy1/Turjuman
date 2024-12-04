const express = require("express");
const userController = require("./../Controllers/userController");
const adminController = require("../Controllers/adminController");
const authController = require("./../Controllers/authController");

const router = express.Router();

router.get(
  "/top-users",
  authController.protect,
  authController.restricTo("admin"),
  adminController.getTopActiveUsers
);

router.get(
  "/user-Analytics",
  authController.protect,
  authController.restricTo("admin"),
  adminController.getUsageAnalytics
);

router.get(
  "/Usage-Analytics",
  authController.protect,
  authController.restricTo("admin"),
  adminController.getUsageAnalytics
);

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.patch("/:id", userController.updateUser);
router.delete("/:id", userController.deleteMe);

router
  .route("/")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    userController.getAllUsers
  );

router
  .route("/:id")
  .get(
    authController.protect,
    authController.restricTo("admin"),
    userController.getUser
  );

module.exports = router;
