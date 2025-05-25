import express from 'express';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategoryId,
  searchProducts,
  getProductById,
  getProductsBySellerId, // yeni eklenen fonksiyon
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getAllProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/category/:categoryId', getProductsByCategoryId);
router.get('/search', searchProducts); // Added search route
router.get('/seller/:sellerId', getProductsBySellerId);
router.get('/:id', getProductById);

export default router;