import express from 'express';
import { verifyStripe, userOrders, placeOrder, placeRazorpay, placeStripe, updateOrderStatus, allOrders } from '../controllers/orderController.js';
import adminAuth from './../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const orderRouter = express.Router();

// Admin feature
orderRouter.post('/list',
    adminAuth,
    allOrders
);
orderRouter.post('/status',
    adminAuth,
    updateOrderStatus
);


// Payment feature
orderRouter.post('/place',
    authUser,
    placeOrder
);
orderRouter.post('/stripe',
    authUser,
    placeStripe
);
// Verify payment
orderRouter.post('/verifyStripe',
    authUser,
    verifyStripe   
)
orderRouter.post('/razorpay',
    authUser,
    placeRazorpay
);


// User feature
orderRouter.post('/userorders',
    authUser,
    userOrders
)


export default orderRouter;