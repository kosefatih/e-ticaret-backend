import express from 'express';
import {
  createCategory,
  getAllCategories,
  deleteCategory,
  getProductsByCategoryId
} from '../controllers/categoryController.js';

const router = express.Router();

router.post('/', createCategory);
router.get('/', getAllCategories);
router.delete('/:id', deleteCategory);
router.get('/:id/products', getProductsByCategoryId);

export default router;
