import express from 'express';
import { getTotalSales, getPendingOrders, getLowStockAlerts, getTopProducts, getReviews } from '../controllers/analyticsController.js';
import adminAuth from "../middleware/adminAuth.js";


const router = express.Router();

// Apply authentication middleware to all routes
router.use(adminAuth);

// Analytics routes
router.get('/total-sales', getTotalSales);
router.get('/pending-orders', getPendingOrders);
router.get('/low-stock-alerts', getLowStockAlerts);
router.get('/top-products', getTopProducts);
router.get('/reviews', getReviews);

export default router;