import Product from '../models/Product.js';
import Category from '../models/Category.js';
import multer from 'multer';
import mongoose from 'mongoose';
import cloudinary from '../cloudinaryConfig.js';
import { v4 as uuidv4 } from 'uuid';

// Multer yapılandırması (değişmedi)
const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB dosya boyutu sınırı
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Sadece JPEG veya PNG resimler yüklenebilir'), false);
    }
  },
}).array('images', 5); // Maksimum 5 resim

// Tüm ürünleri listele (kategori, alt kategori ve durum filtresi)
export const getAllProducts = async (req, res) => {
  try {
    const { category, subcategory, status } = req.query;

    const query = {};
    if (category) {
      const categoryDoc = await Category.findById(category).select('subcategories');
      if (!categoryDoc) {
        return res.status(400).json({ message: 'Geçersiz kategori ID' });
      }
      query.category = { $in: [category, ...categoryDoc.subcategories] };
    }
    if (subcategory) {
      const subcategoryDoc = await Category.findById(subcategory);
      if (!subcategoryDoc || !subcategoryDoc.parent) {
        return res.status(400).json({ message: 'Geçersiz veya geçerli bir alt kategori değil' });
      }
      query.subcategory = subcategory;
    }
    if (status) {
      if (!['active', 'inactive', 'onDiscount'].includes(status)) {
        return res.status(400).json({ message: 'Geçersiz durum: active, inactive veya onDiscount olmalı' });
      }
      query.status = status;
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Ürünler getirilirken hata oluştu', error: err.message });
  }
};

// Ürün oluşturma (resim yükleme ile)
export const createProduct = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ message: err.message });
    }

    const { name, description, category, subcategory, price, discountPrice, stock, seller, status } =
      req.body;

    try {
      // Doğrulamalar
      if (!name || !price || !stock || !subcategory) {
        return res.status(400).json({
          message: 'Zorunlu alanlar eksik: name, price, stock veya subcategory',
        });
      }

      // Durum doğrulaması
      const validStatuses = ['active', 'inactive', 'onDiscount'];
      const productStatus = status || 'active'; // Varsayılan olarak active
      if (!validStatuses.includes(productStatus)) {
        return res.status(400).json({
          message: 'Geçersiz durum: active, inactive veya onDiscount olmalı',
        });
      }
      if (productStatus === 'onDiscount' && (!discountPrice || parseFloat(discountPrice) >= parseFloat(price))) {
        return res.status(400).json({
          message: 'onDiscount durumunda discountPrice zorunlu ve price\'tan küçük olmalı',
        });
      }

      // Alt kategori doğrulaması
      const subcategoryDoc = await Category.findById(subcategory);
      if (!subcategoryDoc) {
        return res.status(400).json({ message: 'Geçersiz alt kategori ID' });
      }
      if (!subcategoryDoc.parent) {
        return res.status(400).json({
          message: 'Belirtilen ID bir alt kategori değil, bir üst kategori',
        });
      }

      // Kategori doğrulaması
      let parsedCategory = [];
      if (category) {
        try {
          parsedCategory = JSON.parse(category);
          if (!Array.isArray(parsedCategory)) {
            return res.status(400).json({ message: 'Kategori bir dizi olmalıdır' });
          }
        } catch (e) {
          return res.status(400).json({ message: 'Geçersiz kategori formatı' });
        }

        const isValidCategories = parsedCategory.every((id) =>
          mongoose.Types.ObjectId.isValid(id)
        );
        if (!isValidCategories) {
          return res.status(400).json({ message: 'Geçersiz kategori ID' });
        }

        if (!parsedCategory.includes(subcategoryDoc.parent.toString())) {
          return res.status(400).json({
            message: 'Alt kategorinin üst kategorisi, kategori listesinde olmalıdır',
          });
        }
      } else {
        parsedCategory = [subcategoryDoc.parent];
      }

      // Resimleri Cloudinary'e yükle
      const imageUrls = [];
      if (req.files && req.files.length > 0) {
        if (!cloudinary.uploader) {
          console.error('Cloudinary uploader undefined');
          throw new Error('Cloudinary uploader başlatılamadı');
        }

        for (const file of req.files) {
          console.log('Uploading file:', file.originalname);
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'products',
                public_id: `product_${uuidv4()}`,
                resource_type: 'image',
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(file.buffer);
          });
          imageUrls.push(result.secure_url);
          console.log('Uploaded to Cloudinary:', result.secure_url);
        }
      }

      // Yeni ürünü oluştur
      const newProduct = new Product({
        name,
        description,
        category: parsedCategory,
        subcategory,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : 0,
        stock: parseInt(stock),
        seller,
        images: imageUrls,
        status: productStatus,
      });

      await newProduct.save();
      const populatedProduct = await Product.findById(newProduct._id)
        .populate('category', 'name')
        .populate('subcategory', 'name');
      res.status(201).json(populatedProduct);
    } catch (err) {
      console.error('Error creating product:', err);
      res.status(500).json({
        message: 'Ürün oluşturulurken hata oluştu',
        error: err.message,
      });
    }
  });
};

// Ürün güncelleme
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { status, price, discountPrice, ...otherData } = req.body;

  try {
    // Durum doğrulaması
    if (status) {
      const validStatuses = ['active', 'inactive', 'onDiscount'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Geçersiz durum: active, inactive veya onDiscount olmalı',
        });
      }
      if (status === 'onDiscount') {
        if (!discountPrice || parseFloat(discountPrice) >= parseFloat(price || req.body.price)) {
          return res.status(400).json({
            message: 'onDiscount durumunda discountPrice zorunlu ve price\'tan küçük olmalı',
          });
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...otherData, status, price: price ? parseFloat(price) : undefined, discountPrice: discountPrice ? parseFloat(discountPrice) : undefined },
      { new: true }
    )
      .populate('category', 'name')
      .populate('subcategory', 'name');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Ürün güncellenirken hata oluştu', error: err.message });
  }
};

// Kategori ID'sine göre ürün getir
export const getProductsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Kategorinin varlığını kontrol et
    const category = await Category.findById(categoryId).select('subcategories');
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    // Kategori ve alt kategorilerindeki ürünleri getir
    const categoryIds = [categoryId, ...category.subcategories];

    const products = await Product.find({ category: { $in: categoryIds } })
      .populate('category', 'name')
      .populate('subcategory', 'name');
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({
      message: 'Kategoriye göre ürünler getirilirken hata oluştu',
      error: err.message,
    });
  }
};

// Ürünleri arama terimiyle filtrele
export const searchProducts = async (req, res) => {
  try {
    const { searchTerm, status } = req.query;

    if (!searchTerm) {
      return res.status(400).json({ message: 'Arama terimi gereklidir' });
    }

    const query = {};
    if (status) {
      if (!['active', 'inactive', 'onDiscount'].includes(status)) {
        return res.status(400).json({ message: 'Geçersiz durum: active, inactive veya onDiscount olmalı' });
      }
      query.status = status;
    }

    // Case-insensitive search with partial match
    const searchRegex = new RegExp(searchTerm, 'i');

    // Find categories and subcategories matching the search term
    const matchingCategories = await Category.find({ name: searchRegex }).select('_id');

    // Search products by name or category (including subcategories)
    query.$or = [
      { name: searchRegex },
      { category: { $in: matchingCategories.map((cat) => cat._id) } },
      { subcategory: { $in: matchingCategories.map((cat) => cat._id) } },
    ];

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Ürünler aranırken hata oluştu', error: err.message });
  }
};

// Ürün silme (değişmedi)
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.status(200).json({ message: 'Ürün başarıyla silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Ürün silinirken hata oluştu', error: err.message });
  }
};

export const getProductsBySellerId = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: 'Geçersiz kullanıcı ID’si' });
    }

    const products = await Product.find({ seller: sellerId })
      .populate('category', 'name')
      .populate('subcategory', 'name');

    res.status(200).json(products);
  } catch (err) {
    console.error('getProductsBySellerId error:', err);
    res.status(500).json({ message: 'Ürünler getirilirken hata oluştu', error: err.message });
  }
};


// Ürün detayı getir
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // ID geçerliliği kontrolü
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Geçersiz ürün ID’si' });
    }

    // Ürünü bul ve category ile subcategory referanslarını populate et
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('seller', 'username email'); // isterseniz seller’dan da bilgi çekebilirsiniz

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ message: 'Ürün detayları getirilirken hata oluştu', error: err.message });
  }
};

