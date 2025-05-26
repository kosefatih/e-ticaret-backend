import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Kullanıcının sepetindeki ürünleri listele
export const getCartItems = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json(cart.items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cart items' });
  }
};

// Sepete ürün ekle
export const addToCart = async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity } = req.body;

  try {
    // Ürün var mı kontrol et
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Kullanıcının sepetini bul ya da yeni sepet oluştur
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Sepette bu ürün var mı kontrol et
    const existingItem = cart.items.find(item => item.productId.toString() === productId);

    if (existingItem) {
      // Eğer ürün varsa, miktarı güncelle
      existingItem.quantity += quantity;
    } else {
      // Eğer yoksa, yeni bir ürün ekle
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error adding product to cart' });
  }
};

// Sepetten ürün sil
export const removeFromCart = async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Sepette ürünü bul ve sil
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    await cart.save();

    res.status(200).json({ message: 'Product removed from cart' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing product from cart' });
  }
};

// Sepet ürün miktarını güncelle
export const updateCartQuantity = async (req, res) => {
  const { userId, productId } = req.params;
  const { quantity } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => item.productId.toString() === productId);

    if (!item) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    // Miktarı güncelle
    item.quantity = quantity;

    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error updating cart quantity' });
  }
};

// Sepetten sipariş oluştur
export const createOrderFromCart = async (req, res) => {
  const { userId } = req.params;

  try {
    // Kullanıcının sepetini bul
    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      select: 'price name seller stock' // stock bilgisini de seçiyoruz
    });
    
    if (!cart) {
      return res.status(404).json({ message: 'Sepet bulunamadı' });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({ message: 'Sepetiniz boş' });
    }

    // Stok kontrolü yap
    for (const item of cart.items) {
      if (!item.productId) {
        throw new Error('Ürün bulunamadı');
      }
      if (item.productId.stock < item.quantity) {
        return res.status(400).json({ 
          message: `${item.productId.name} ürünü için yeterli stok yok. Mevcut stok: ${item.productId.stock}` 
        });
      }
    }

    // Toplam tutarı hesapla ve ürünleri satıcılara göre grupla
    let totalAmount = 0;
    const orderProducts = cart.items.map(item => {
      const productTotal = item.productId.price * item.quantity;
      totalAmount += productTotal;
      
      return {
        product: item.productId._id,
        quantity: item.quantity,
        seller: item.productId.seller
      };
    });

    // Yeni sipariş oluştur
    const newOrder = new Order({
      user: userId,
      products: orderProducts,
      totalAmount,
      status: 'hazırlanıyor'
    });

    // Stokları güncelle
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.productId._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    await newOrder.save();

    // Sepeti temizle
    cart.items = [];
    await cart.save();

    // Oluşturulan siparişi populate ederek döndür
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('products.product')
      .populate('products.seller', 'username email')
      .populate('user', 'username email');

    res.status(201).json({
      message: 'Sipariş başarıyla oluşturuldu',
      order: populatedOrder
    });
  } catch (err) {
    console.error('Sipariş oluşturma hatası:', err);
    res.status(500).json({ 
      message: 'Sipariş oluşturulurken bir hata oluştu', 
      error: err.message 
    });
  }
};
