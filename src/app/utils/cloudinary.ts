import { v2 as cloudinary } from "cloudinary";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (imageBuffer: Buffer, mimeType: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "receiptiq_avatars" },
      (error, result) => {
        if (error) return reject(error);
        if (result) resolve(result.secure_url);
        else reject(new Error("Unknown error during upload"));
      }
    );
    uploadStream.end(imageBuffer);
  });
};
