import Favorite from "../models/Favorite.js";

export const addFavorite = async (req, res) => {
  const { userId, productId } = req.params;

  try {
    // Aynı ürün favorilerde varsa tekrar eklenmesin
    const exists = await Favorite.findOne({ user: userId, product: productId });
    if (exists) return res.status(400).json({ message: "Zaten favorilere eklenmiş." });

    const favorite = new Favorite({ user: userId, product: productId });
    await favorite.save();

    res.status(201).json({ message: "Favorilere eklendi", favorite });
  } catch (err) {
    res.status(500).json({ message: "Favori eklenemedi", error: err.message });
  }
};

export const removeFavorite = async (req, res) => {
  const { userId, productId } = req.params;

  try {
    await Favorite.findOneAndDelete({ user: userId, product: productId });
    res.status(200).json({ message: "Favorilerden kaldırıldı" });
  } catch (err) {
    res.status(500).json({ message: "Favori silinemedi", error: err.message });
  }
};

export const getUserFavorites = async (req, res) => {
  const { userId } = req.params;

  try {
    const favorites = await Favorite.find({ user: userId }).populate("product");
    res.status(200).json(favorites);
  } catch (err) {
    res.status(500).json({ message: "Favoriler alınamadı", error: err.message });
  }
};
