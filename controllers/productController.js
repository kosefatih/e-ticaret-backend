import Product from '../models/Product.js';

// Tüm ürünleri listele
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// Yeni ürün ekle
export const createProduct = async (req, res) => {
  const { name, description, category, price, stock } = req.body;

  try {
    const newProduct = new Product({
      name,
      description,
      category,
      price,
      stock,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error creating product' });
  }
};

// Ürünü güncelle
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, stock } = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, description, category, price, stock },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product' });
  }
};

// Ürünü sil
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product' });
  }
};
