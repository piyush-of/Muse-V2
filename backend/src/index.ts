import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import apiRouter from './routes/api';
import { registerBackgroundJobs } from './services/cron';

const app = express();

// Express JSON and urlencoded request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup CORS middleware for frontend connections
app.use(cors({
  origin: '*', // In production, replace with specific frontend domains
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create upload directory if it does not exist
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(config.uploadDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Mount routing endpoints
app.use('/api', apiRouter);

// Register Node-Cron background jobs (daily outfit generators)
registerBackgroundJobs();

// Boot Express server
app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(` MUSE Backend listening on port ${config.port}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Serving uploads from: ${config.uploadDir}`);
  console.log(`===============================================`);
});
