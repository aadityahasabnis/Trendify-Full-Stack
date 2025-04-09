import express from "express";
import {
    addReview,
    getUserReviews,
    getProductReviews,
    deleteReview,
    getProductReviewStats,
    updateReview
} from "../controllers/reviewController.js";
import { authUser, adminAuth } from "../middleware/authMiddleware.js";

const reviewRouter = express.Router();

// Get user reviews (user only)
reviewRouter.get('/user', authUser, getUserReviews);

// Get product reviews and stats (public)
reviewRouter.get('/product/:productId', getProductReviews);
reviewRouter.get('/stats/:productId', getProductReviewStats);

// Add review (user only) 
reviewRouter.post('/add', authUser, addReview);

// Update review (user only)
reviewRouter.put('/update/:reviewId', authUser, updateReview);

// Delete a review (Admin or user who created the review)
reviewRouter.delete('/:reviewId', authUser, deleteReview);

export default reviewRouter;
