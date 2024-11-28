const express = require("express");
const userController = require("./../Controllers/userController");
const authController = require("./../Controllers/authController");


const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.patch("/:id", userController.updateUser);
router.delete("/:id", userController.deleteMe);

router.route("/").get(userController.getAllUsers);
router.route("/:id").get(userController.getUser);

module.exports = router;