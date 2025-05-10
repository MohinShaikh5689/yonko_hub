import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Configure Cloudinary with environment variables
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
};

// Configure Cloudinary with the config object
cloudinary.config(cloudinaryConfig);


// Create separate storage configurations for different upload types
const communityStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mugiwara_hub/community_covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 400, height: 400, crop: "fill" }]
  } as any
});

const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mugiwara_hub/profile_pictures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'], 
    transformation: [{ width: 400, height: 400, crop: "fill" }]
  } as any
});

// Create multer middleware with the configured storage
const uploadCommunity = multer({ storage: communityStorage });
const uploadProfile = multer({ storage: profileStorage });

// Export all necessary components
export { 
  cloudinary,
  uploadCommunity,
  uploadProfile 
};