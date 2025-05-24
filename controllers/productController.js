import Product from '../models/Product.js';
import Category from '../models/Category.js'; // Added to populate category name

// Tüm ürünleri listele (filtre desteği: kategori ve altkategori)
export const getAllProducts = async (req, res) => {
  try {
    const { category, subcategory } = req.query;

    const query = {};
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;

    const products = await Product.find(query)
      .populate('category', 'name') // Populate category name
      .sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Ürünler getirilirken hata oluştu', error: err });
  }
};

// Yeni ürün ekle
export const createProduct = async (req, res) => {
  const {
    name,
    description,
    category,
    subcategory,
    price,
    discountPrice,
    stock,
    seller,
    images
  } = req.body;

  try {
    const newProduct = new Product({
      name,
      description,
      category,
      subcategory,
      price,
      discountPrice,
      stock,
      seller,
      images
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Ürün oluşturulurken hata oluştu', error: err });
  }
};

// Ürünü güncelle
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true })
      .populate('category', 'name');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Ürün güncellenirken hata oluştu', error: err });
  }
};

// Ürünü sil
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.status(200).json({ message: 'Ürün başarıyla silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Ürün silinirken hata oluştu', error: err });
  }
};

// Kategoriye göre ürün getir
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const products = await Product.find({ category: categoryName })
      .populate('category', 'name');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: 'Kategoriye göre ürünler getirilirken hata oluştu',
      error,
    });
  }
};

// Ürünleri arama terimiyle filtrele
export const searchProducts = async (req, res) => {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({ message: 'Arama terimi gereklidir' });
    }

    // Case-insensitive search with partial match
    const searchRegex = new RegExp(searchTerm, 'i');

    // Find categories matching the search term
    const matchingCategories = await Category.find({ name: searchRegex }).select('_id');

    // Search products by name, subcategory, or category
    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { subcategory: searchRegex },
        { category: { $in: matchingCategories.map(cat => cat._id) } }
      ]
    })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Ürünler aranırken hata oluştu', error: err });
  }
};