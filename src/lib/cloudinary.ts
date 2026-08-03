import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export async function uploadImageBuffer(buffer: Buffer, folder = "asads-collection") {
  const cld = getCloudinary();
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cld.uploader.upload_stream({ folder }, (err, result) => {
      if (err || !result) return reject(err);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}
