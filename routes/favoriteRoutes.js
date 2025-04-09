import express from "express";
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
} from "../controllers/favoriteController.js";

const router = express.Router();

router.post("/:userId/:productId", addFavorite);
router.delete("/:userId/:productId", removeFavorite);
router.get("/:userId", getUserFavorites);

export default router;
