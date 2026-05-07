"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = void 0;
const cloudinary_1 = require("cloudinary");
// Configuration
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const uploadAvatar = async (imageBuffer, mimeType) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: "receiptiq_avatars" }, (error, result) => {
            if (error) {
                return reject(error);
            }
            if (result) {
                resolve(result.secure_url);
            }
            else {
                reject(new Error("Unknown error during upload to Cloudinary"));
            }
        });
        uploadStream.end(imageBuffer);
    });
};
exports.uploadAvatar = uploadAvatar;
