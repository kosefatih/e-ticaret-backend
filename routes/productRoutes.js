import express from 'express';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts // Added new endpoint
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getAllProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/category/:categoryName', getProductsByCategory);
router.get('/search', searchProducts); // Added search route

export default router;