import Product from '../models/Product.js';
import Category from '../models/Category.js'; // Added to populate category name
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import cloudinary from '../cloudinaryConfig.js';

// Multer yapılandırması
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

// Ürün oluşturma (resim yükleme ile)
export const createProduct = async (req, res) => {
  // Multer middleware'i ile birden fazla resim yükleme
  upload.array('image', 5)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Resim yüklenirken hata oluştu', error: err.message });
    }

    const {
      name,
      description,
      category,
      subcategory,
      price,
      discountPrice,
      stock,
      seller
    } = req.body;

    try {
      // Doğrulamalar
      if (!Array.isArray(category)) {
        return res.status(400).json({ message: 'Kategori bir dizi olmalıdır' });
      }
      if (!name || !price || !stock || !subcategory) {
        return res.status(400).json({ message: 'Zorunlu alanlar eksik: name, price, stock veya subcategory' });
      }

      // Kategorilerin geçerli ObjectId olup olmadığını kontrol et
      const isValidCategories = category.every(id => mongoose.Types.ObjectId.isValid(id));
      if (!isValidCategories) {
        return res.status(400).json({ message: 'Geçersiz kategori ID' });
      }

      // Resimleri Cloudinary'e yükle
      const imageUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload_stream({ resource_type: 'image' })
            .end(file.buffer);
          imageUrls.push(result.secure_url);
        }
      }

      const newProduct = new Product({
        name,
        description,
        category, // Dizi olarak kaydedilir
        subcategory,
        price,
        discountPrice,
        stock,
        seller,
        images: imageUrls
      });

      await newProduct.save();
      const populatedProduct = await Product.findById(newProduct._id).populate('category', 'name');
      res.status(201).json(populatedProduct);
    } catch (err) {
      res.status(500).json({ message: 'Ürün oluşturulurken hata oluştu', error: err.message });
    }
  });
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


// Kategori ID'sine göre ürün getir
export const getProductsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Kategorinin varlığını kontrol et
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    // Kategori ID'sine göre ürünleri getir
    const products = await Product.find({ category: categoryId })
      .populate('category', 'name');
    
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: 'Kategoriye göre ürünler getirilirken hata oluştu',
      error: error.message, // Hata mesajını daha detaylı döndür
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