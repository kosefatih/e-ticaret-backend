import Category from '../models/Category.js';
import Product from '../models/Product.js';

// Kategori oluştur
export const createCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const category = new Category({ name, parent: parent || null });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error("Kategori oluşturma hatası:", err); // <== bu satırı ekle
    res.status(500).json({ message: 'Kategori oluşturulamadı', error: err });
  }
};


// Tüm kategorileri getir (hiyerarşik yapıyla)
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parent', 'name');
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Kategoriler getirilirken hata oluştu', error: err });
  }
};

// Kategori sil
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Alt kategorileri de sil (opsiyonel)
    await Category.deleteMany({ parent: id });

    // Ana kategoriyi sil
    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: 'Kategori bulunamadı' });

    res.status(200).json({ message: 'Kategori silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Kategori silinirken hata oluştu', error: err });
  }
};

// Kategoriye ait ürünleri getir
export const getProductsByCategoryId = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: 'Kategori bulunamadı' });

    const products = await Product.find({ category: category.name });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Ürünler getirilirken hata oluştu', error: err });
  }
};
