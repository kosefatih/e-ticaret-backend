// cloudinaryConfig.js
import { v2 as cloudinary } from 'cloudinary';

try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (err) {
  console.error('Cloudinary yapılandırması başarısız:', err.message);
  throw new Error('Cloudinary yapılandırması başarısız');
}

export default cloudinary;