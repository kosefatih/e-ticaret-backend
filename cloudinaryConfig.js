// cloudinaryConfig.js
import { v2 as cloudinary } from 'cloudinary';

try {
  cloudinary.config({
    cloud_name: "dbqvtrvui",
    api_key: "862886549597472",
    api_secret: "D0FbIMHXiY0Xuyd8iInmTVTN2s0",
  });
} catch (err) {
  console.error('Cloudinary yapılandırması başarısız:', err.message);
  throw new Error('Cloudinary yapılandırması başarısız');
}

export default cloudinary;