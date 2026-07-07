import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary only if URL or config variables are set
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

export interface UploadResult {
  originalUrl: string;
  thumbnailUrl: string;
}

/**
 * Uploads a base64 encoded image or raw buffer to Cloudinary
 */
export async function uploadGarmentPhoto(base64Image: string, fileName: string): Promise<UploadResult> {
  const isCloudinaryConfigured = !!(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );

  if (!isCloudinaryConfigured) {
    console.warn("Cloudinary credentials are not set. Returning mock upload paths.");
    return {
      originalUrl: `/mock-uploads/${Date.now()}-${fileName}`,
      thumbnailUrl: `/mock-uploads/${Date.now()}-thumb-${fileName}`
    };
  }

  try {
    const uploadOptions = {
      folder: 'muse_garments',
      public_id: `${Date.now()}-${fileName.split('.')[0]}`,
      overwrite: true,
      resource_type: 'image' as const
    };

    const response = await cloudinary.uploader.upload(base64Image, uploadOptions);

    // Generate thumbnail using Cloudinary transformation URL features
    const thumbnailUrl = cloudinary.url(response.public_id, {
      width: 300,
      height: 400,
      crop: 'fill',
      gravity: 'center',
      quality: 'auto',
      fetch_format: 'auto'
    });

    return {
      originalUrl: response.secure_url,
      thumbnailUrl: thumbnailUrl
    };
  } catch (error) {
    console.error("Cloudinary upload failed, returning mock fallback:", error);
    return {
      originalUrl: `/mock-uploads/${Date.now()}-${fileName}`,
      thumbnailUrl: `/mock-uploads/${Date.now()}-thumb-${fileName}`
    };
  }
}
