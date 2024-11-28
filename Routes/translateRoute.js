const express = require("express");
const translateController = require("../Controllers/translateController");
// const savedTransController = require("../Controllers/savedtransController");
const authController = require("../Controllers/authController");

const router = express.Router({ mergeParams: true });

router.post(
  "/translate-and-save",
  authController.protect, // This middleware will verify the JWT token before allowing the request
  translateController.translateAndSave
  //   savedTransController.saveTranslation
);

// Add more routes here if needed
router.get(
  "/translates",
  authController.protect,
  translateController.getUserTranslation
);

router.get(
  "/favorites/translates",
  authController.protect,
  translateController.getFavorites
);
module.exports = router;
