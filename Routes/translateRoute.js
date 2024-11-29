const express = require("express");
const translateController = require("../Controllers/translateController");
// const savedTransController = require("../Controllers/savedtransController");
const authController = require("../Controllers/authController");

const router = express.Router({ mergeParams: true });

router.post(
  "/translate-and-save",
  authController.protect,
  translateController.translateAndSave
);

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

router.get(
  "/all-translates",
  translateController.getalltranslations
);

router.delete(
  "/translates/:id",
  authController.protect,
  translateController.deleteTranslationById
);
module.exports = router;
