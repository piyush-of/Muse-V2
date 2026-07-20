if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXTAUTH_SECRET is not set. Refusing to start in production with no session signing secret.'
    );
  }
  console.warn(
    '⚠️  NEXTAUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to your .env file.'
  );
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.NEXTAUTH_SECRET || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    url: process.env.CLOUDINARY_URL || ''
  },
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};
