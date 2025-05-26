import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const createOrder = async (req, res) => {
  try {
    const { userId, products, totalAmount } = req.body;

    const newOrder = new Order({
      user: userId,
      products,
      totalAmount,
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: "Sipariş oluşturulamadı", error: err.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).populate("products.product");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Siparişler alınamadı", error: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user").populate("products.product");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Siparişler alınamadı", error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('products.product');
    if (!order) return res.status(404).json({ message: "Sipariş bulunamadı" });

    // Eğer sipariş iptal ediliyorsa stokları geri ekle
    if (status === "iptal" && order.status !== "iptal") {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: "Durum güncellenemedi", error: err.message });
  }
};

// Satıcının siparişlerini getir
export const getSellerOrders = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const orders = await Order.find({
      'products.seller': sellerId
    })
    .populate('user', 'username email')
    .populate('products.product')
    .populate('products.seller', 'username email');

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Satıcı siparişleri alınamadı", error: err.message });
  }
};
