import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  subcategory: {
    type: String,
    required: true // örnek: "Sebze Tohumu", "Meyve Tohumu"
  },
  attributes: {
    type: Map,
    of: String
    // örnek kullanım: attributes: { mevsim: "İlkbahar", tür: "Organik" }
  },
  price: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  images: [String] // Görsel URL'leri için
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;
