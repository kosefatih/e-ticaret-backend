// server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js'; // Yorumlar için route ekle
import favoriteRoutes from './routes/favoriteRoutes.js'; // Favoriler için route ekle
import orderRoutes from './routes/orderRoutes.js'; // Siparişler için route ekle

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI,)
.then(() => console.log('MongoDB connected ✅'))
.catch((err) => console.error('MongoDB connection error ❌', err));


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes); // Yorumlar için route ekle
app.use('/api/favorites', favoriteRoutes); // Favoriler için route ekle
app.use('/api/orders', orderRoutes); // Siparişler için route ekle

// Server başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});