import Category from '../models/Category.js';
import Product from '../models/Product.js';


// Kategori veya alt kategori oluştur
export const createCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;

    // Kategori adı zorunlu
    if (!name) {
      return res.status(400).json({ message: 'Kategori adı zorunlu' });
    }

    // Kategori adı kontrolü (case-insensitive, aynı seviyede benzersizlik)
    const existingCategory = await Category.findOne({ 
      name: { $regex: `^${name}$`, $options: 'i' },
      parent: parent || null // Aynı parent altında benzersizlik kontrolü
    });
    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Bu isimde bir kategori veya alt kategori zaten mevcut' 
      });
    }

    // Eğer parent belirtilmişse, geçerli olup olmadığını kontrol et
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Belirtilen üst kategori bulunamadı' });
      }
    }

    // Yeni kategori veya alt kategori oluştur
    const category = new Category({ 
      name, 
      parent: parent || null, 
      subcategories: [] 
    });
    await category.save();

    // Eğer parent varsa, parent kategorinin subcategories dizisine ekle
    if (parent) {
      await Category.findByIdAndUpdate(
        parent,
        { $addToSet: { subcategories: category._id } },
        { new: true }
      );
      return res.status(201).json({ 
        message: 'Alt kategori başarıyla oluşturuldu', 
        category 
      });
    }

    res.status(201).json({ 
      message: 'Kategori başarıyla oluşturuldu', 
      category 
    });
  } catch (err) {
    console.error("Kategori oluşturma hatası:", err);
    res.status(500).json({ 
      message: 'Kategori veya alt kategori oluşturulamadı', 
      error: err.message 
    });
  }
};

// Tek bir kategoriyi ID'ye göre getir
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id)
      .populate('parent', 'name')
      .populate('subcategories', 'name'); // subcategories populate edildi
    
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
    const categories = await Category.find()
      .populate('parent', 'name')
      .populate('subcategories', 'name'); // subcategories populate edildi
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
    const parentCategory = await Category.findById(parentId).populate('subcategories', 'name');
    
    if (!parentCategory) {
      return res.status(404).json({ message: 'Üst kategori bulunamadı' });
    }
    
    res.status(200).json(parentCategory.subcategories);
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

    // Üst kategoriden bu kategoriyi kaldır
    if (category.parent) {
      await Category.findByIdAndUpdate(
        category.parent,
        { $pull: { subcategories: id } },
        { new: true }
      );
    }

    // Alt kategorileri sil
    if (category.subcategories.length > 0) {
      await Category.deleteMany({ _id: { $in: category.subcategories } });
    }

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
    const categoryIds = [id, ...category.subcategories]; // subcategories direkt kullanılabilir

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