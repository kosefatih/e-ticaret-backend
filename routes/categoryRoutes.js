import express from 'express';
import {
  createCategory,
  getCategoryById,
  getAllCategories,
  getSubcategories,
  deleteCategory,
  getProductsByCategoryId
} from '../controllers/categoryController.js';

const router = express.Router();

// Kategori oluştur
router.post('/', createCategory);

// Tüm kategorileri getir
router.get('/', getAllCategories);

// ID'ye göre tek kategori getir
router.get('/:id', getCategoryById);

// Alt kategorileri getir
router.get('/:parentId/subcategories', getSubcategories);

// Kategori sil
router.delete('/:id', deleteCategory);

// Kategoriye ait ürünleri getir (artık alt kategorilerdekileri de içeriyor)
router.get('/:id/products', getProductsByCategoryId);

export default router;