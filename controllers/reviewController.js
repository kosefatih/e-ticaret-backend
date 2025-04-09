import Review from "../models/Review.js";
import Product from "../models/Product.js";

export const createReview = async (req, res) => {
  try {
    const { comment, rating, userId } = req.body;
    const { productId } = req.params;

    const newReview = new Review({
      user: userId,
      product: productId,
      comment,
      rating,
    });

    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ message: "Yorum eklenemedi", error: err.message });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId }).populate("user", "name");
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Yorumlar alınamadı", error: err.message });
  }
};
