import express from 'express';
import { adminAuth } from '../middleware/authMiddleware.js';
import {
    getDashboardStats,
    getProductAnalytics,
    getInventoryAlerts
} from '../controllers/adminController.js';

const router = express.Router();

// Apply admin authentication middleware to all routes
router.use(adminAuth);

// Dashboard routes
router.get('/dashboard', getDashboardStats);
router.get('/dashboard/product/:productId', getProductAnalytics);
router.get('/dashboard/inventory-alerts', getInventoryAlerts);

export default router; 