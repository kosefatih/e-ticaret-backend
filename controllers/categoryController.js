import Category from '../models/Category.js';
import Product from '../models/Product.js';

// Kategori oluştur
export const createCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;

    // Eğer parent belirtilmişse geçerli olup olmadığını kontrol et
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Belirtilen üst kategori bulunamadı' });
      }
    }

    // Kategori adı kontrolü (case-insensitive)
    const existingCategory = await Category.findOne({ 
      name: { $regex: `^${name}$`, $options: 'i' } 
    });
    if (existingCategory) {
      return res.status(400).json({ message: 'Bu isimde bir kategori zaten mevcut' });
    }

    const category = new Category({ name, parent: parent || null });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error("Kategori oluşturma hatası:", err);
    res.status(500).json({ message: 'Kategori oluşturulamadı', error: err.message });
  }
};

// Tek bir kategoriyi ID'ye göre getir
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).populate('parent', 'name');
    
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    res.status(200).json(category);
  } catch (err) {
    res.status(500).json({ 
      message: 'Kategori getirilirken hata oluştu', 
      error: err.message 
    });
  }
};

// Tüm kategorileri getir (hiyerarşik yapıyla)
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parent', 'name');
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ 
      message: 'Kategoriler getirilirken hata oluştu', 
      error: err.message 
    });
  }
};

// Alt kategorileri getir (belirli bir parent ID'ye göre)
export const getSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    const subcategories = await Category.find({ parent: parentId });
    
    res.status(200).json(subcategories);
  } catch (err) {
    res.status(500).json({ 
      message: 'Alt kategoriler getirilirken hata oluştu',
      error: err.message 
    });
  }
};

// Kategori sil
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Silinecek kategoriyi bul
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    // Bu kategoriye ait ürünler var mı kontrol et
    const productsCount = await Product.countDocuments({ category: id });
    if (productsCount > 0) {
      return res.status(400).json({ 
        message: 'Bu kategoriye ait ürünler var, önce ürünleri silmelisiniz' 
      });
    }

    // Alt kategorileri de sil (opsiyonel - isteğe bağlı olarak kaldırılabilir)
    await Category.deleteMany({ parent: id });

    // Ana kategoriyi sil
    await Category.findByIdAndDelete(id);

    res.status(200).json({ message: 'Kategori ve alt kategorileri silindi' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Kategori silinirken hata oluştu', 
      error: err.message 
    });
  }
};

// Kategoriye ait ürünleri getir
export const getProductsByCategoryId = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    // Kategori ve alt kategorilerindeki tüm ürünleri getir
    const categoryIds = [id];
    // Alt kategorileri bul
    const subcategories = await Category.find({ parent: id });
    subcategories.forEach(sub => categoryIds.push(sub._id));

    const products = await Product.find({ 
      category: { $in: categoryIds } 
    }).populate('category', 'name');
    
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ 
      message: 'Ürünler getirilirken hata oluştu', 
      error: err.message 
    });
  }
};