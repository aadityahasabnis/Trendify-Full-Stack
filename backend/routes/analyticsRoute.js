import express from "express";
import { adminAuth } from "../middleware/authMiddleware.js";
import {
    getTotalSales,
    getPendingOrders,
    getLowStockAlerts,
    getTopProducts,
    getReviews
} from "../controllers/analyticsController.js";

const analyticsRouter = express.Router();

// Apply admin auth middleware to all routes
analyticsRouter.use(adminAuth);

// Analytics routes
analyticsRouter.get('/total-sales', getTotalSales);
analyticsRouter.get('/pending-orders', getPendingOrders);
analyticsRouter.get('/low-stock-alerts', getLowStockAlerts);
analyticsRouter.get('/top-products', getTopProducts);
analyticsRouter.get('/reviews', getReviews);

export default analyticsRouter;