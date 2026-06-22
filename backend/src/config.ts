import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'muse_fallback_secret_key_12345',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
};
