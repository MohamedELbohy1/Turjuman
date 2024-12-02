const express = require("express");
const translateController = require("../Controllers/translateController");
const authController = require("../Controllers/authController");

const router = express.Router({ mergeParams: true });

router.post(
  "/translate-and-save",
  authController.protect,
  translateController.checkTranslationLimit,
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

router.get("/all-translates", translateController.getalltranslations);

router.delete(
  "/translates/:id",
  authController.protect,
  translateController.deleteTranslationById
);

router.get(
  "/translats/search",
  authController.protect,
  translateController.searchAndFilterTranslations
);

module.exports = router;
