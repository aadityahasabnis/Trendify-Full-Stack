import express from 'express';
import { authUser } from '../middleware/authMiddleware.js';
import { getPersonalizedRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

// Get personalized recommendations for authenticated users
router.get('/', authUser, getPersonalizedRecommendations);

export default router; 