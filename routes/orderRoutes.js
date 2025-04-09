import express from "express";
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", createOrder); // sipariş oluştur
router.get("/user/:userId", getUserOrders); // kullanıcının siparişleri
router.get("/", getAllOrders); // admin/satıcı tüm siparişleri görebilir
router.patch("/:orderId", updateOrderStatus); // sipariş durumu güncelleme

export default router;
