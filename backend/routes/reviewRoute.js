import express from "express";
import {
    addReview,
    getUserReviews,
    getProductReviews,
    deleteReview
} from "../controllers/reviewController.js";
import { authUser, adminAuth } from "../middleware/authMiddleware.js";

const reviewRouter = express.Router();

// Get user reviews (user only)
reviewRouter.get('/user', authUser, getUserReviews);

// Get product reviews (public)
reviewRouter.get('/product/:productId', getProductReviews);

// Add review (user only) 
reviewRouter.post('/add', authUser, addReview);

// Delete a review (Admin or user who created the review)
reviewRouter.delete('/:reviewId', authUser, deleteReview);

export default reviewRouter;
