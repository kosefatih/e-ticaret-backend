import express from "express";
import {
  createReview,
  getProductReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

router.post("/:productId", createReview);
router.get("/:productId", getProductReviews);

export default router;
