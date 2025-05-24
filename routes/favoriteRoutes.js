import express from "express";
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavoriteStatus
} from "../controllers/favoriteController.js";

const router = express.Router();

router.post("/:userId/:productId", addFavorite);
router.delete("/:userId/:productId", removeFavorite);
router.get("/:userId", getUserFavorites);
router.get('/:userId/check/:productId', checkFavoriteStatus);


export default router;
