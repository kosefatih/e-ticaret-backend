import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
category: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }], //
  subcategory: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true },
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
  images: [String],
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'onDiscount'], 
    default: 'active',
    required: true 
  },
}, 
{
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;
