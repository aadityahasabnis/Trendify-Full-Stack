import express from 'express';
import {
    verifyStripe,
    userOrders,
    placeOrder,
    placeRazorpay,
    placeStripe,
    updateOrderStatus,
    allOrders,
    bulkUpdateOrderStatus
} from '../controllers/orderController.js';
import { adminAuth, authUser } from '../middleware/authMiddleware.js';

const orderRouter = express.Router();

// Admin routes
orderRouter.post('/list', adminAuth, allOrders);
orderRouter.post('/status', adminAuth, updateOrderStatus);
orderRouter.post('/bulk-status-update', adminAuth, bulkUpdateOrderStatus);

// Order placement routes (authenticated users)
orderRouter.post('/place', authUser, placeOrder);
orderRouter.post('/stripe', authUser, placeStripe);
orderRouter.post('/razorpay', authUser, placeRazorpay);

// Payment verification
orderRouter.post('/verifyStripe', authUser, verifyStripe);

// User order history
orderRouter.post('/userorders', authUser, userOrders);

export default orderRouter;