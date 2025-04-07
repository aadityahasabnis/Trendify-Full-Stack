import express from "express";
import {
    addReview,
    getProductReviews,
    deleteReview
} from "../controllers/reviewController.js";
import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const reviewRouter = express.Router();

// Get reviews for a specific product (public)
reviewRouter.get('/product/:productId', getProductReviews);

// Add a review (authenticated users only)
reviewRouter.post(
    '/add',
    authUser, // Middleware to authenticate the user
    addReview
);

// Delete a review (admin or review owner only)
reviewRouter.delete(
    '/:reviewId',
    authUser,
    deleteReview
);

// Admin route to delete any review
reviewRouter.delete(
    '/admin/:reviewId',
    adminAuth, // Middleware to authenticate admin
    deleteReview
);

export default reviewRouter;
