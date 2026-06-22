import { Router } from 'express';
import multer from 'multer';
import { signup, login } from '../controllers/authController';
import { getCloset, addClosetItem, updateClosetItem } from '../controllers/closetController';
import { getTodayCapsule, acceptOutfit, rejectOutfit } from '../controllers/capsuleController';
import { getGaps } from '../controllers/discoverController';
import { getStyleProfile } from '../controllers/profileController';
import { authenticateToken } from './authMiddleware';

const router = Router();

// Multer memory-storage configuration for garment photo streams
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024 // 8MB limit
  }
});

// Authentication routes
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// Closet management routes
router.get('/closet', authenticateToken, getCloset);
router.post('/closet', authenticateToken, upload.single('photo'), addClosetItem);
router.patch('/closet/:id', authenticateToken, updateClosetItem);

// Capsule outfit routes
router.get('/capsule/today', authenticateToken, getTodayCapsule);
router.post('/capsule/:id/accept', authenticateToken, acceptOutfit);
router.post('/capsule/:id/reject', authenticateToken, rejectOutfit);

// Discover routes
router.get('/discover/gaps', authenticateToken, getGaps);

// Profile / Style DNA routes
router.get('/profile/style-dna', authenticateToken, getStyleProfile);

export default router;
