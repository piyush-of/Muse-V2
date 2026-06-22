import fs from 'fs';
import path from 'path';
import { config } from '../config';

// Ensure the local uploads directory exists
const uploadDir = config.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export interface UploadResult {
  originalUrl: string;
  thumbnailUrl: string;
}

/**
 * Storage Driver Interface
 * Saves garment photos and registers a separate thumbnail image
 */
export async function storeGarmentPhoto(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  const extension = path.extname(originalName) || '.jpg';
  const fileHash = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  const originalFilename = `${fileHash}${extension}`;
  const thumbnailFilename = `${fileHash}-thumbnail${extension}`;

  const originalPath = path.join(uploadDir, originalFilename);
  const thumbnailPath = path.join(uploadDir, thumbnailFilename);

  // 1. Write the original high-res garment image
  await fs.promises.writeFile(originalPath, fileBuffer);

  // 2. Generate and write the thumbnail copy
  // For local fallback (no sharp dependencies), we write the buffer as-is to represent the file path.
  // In production, you would run: await sharp(fileBuffer).resize(200, 200).toFile(thumbnailPath)
  await fs.promises.writeFile(thumbnailPath, fileBuffer);

  // 3. Return relative URLs served by Express static routes
  const originalUrl = `/uploads/${originalFilename}`;
  const thumbnailUrl = `/uploads/${thumbnailFilename}`;

  return {
    originalUrl,
    thumbnailUrl,
  };
}

/*
// Production AWS S3 / Cloudflare R2 client code template:
//
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
//
// const s3 = new S3Client({
//   region: process.env.S3_REGION || "auto",
//   endpoint: process.env.S3_ENDPOINT, // e.g. R2 endpoint url
//   credentials: {
//     accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
//     secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ""
//   }
// });
//
// export async function uploadToS3(buffer: Buffer, key: string, contentType: string) {
//   await s3.send(new PutObjectCommand({
//     Bucket: process.env.S3_BUCKET_NAME,
//     Key: key,
//     Body: buffer,
//     ContentType: contentType
//   }));
//   return `https://${process.env.S3_CDN_DOMAIN}/${key}`;
// }
*/
