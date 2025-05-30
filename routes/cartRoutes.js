import express from 'express';
import {
  getCartItems,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  createOrderFromCart
} from '../controllers/cartController.js';

const router = express.Router();

router.get('/:userId', getCartItems);
router.post('/:userId', addToCart);
router.delete('/:userId/:productId', removeFromCart);
router.put('/:userId/:productId', updateCartQuantity);
router.post('/:userId/create-order', createOrderFromCart);

export default router;
