import express from 'express';
import { authUser } from '../middleware/authMiddleware.js';
import { getPersonalizedRecommendations, getRelatedProducts } from '../controllers/recommendationController.js';

const router = express.Router();

// Get personalized recommendations for authenticated users
router.get('/', authUser, getPersonalizedRecommendations);

// Get related products for a specific product
router.get('/related/:productId', authUser, getRelatedProducts);

export default router; 