import express from "express";
import { addReview, getProductReviewStats, getProductReviews, deleteReview, getAllReviews, updateReview } from "../controllers/reviewController.js";
import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const reviewRouter = express.Router();

// Add a review (User)
reviewRouter.post(
    '/add',
    authUser, // Middleware to authenticate the user
    addReview
);

// Get all reviews for a product (User/Admin)
reviewRouter.get(
    '/product/:productId',
    getProductReviews
);
reviewRouter.get(
    "/stats/:productId", 
    getProductReviewStats
);

// Delete a review (Admin)
reviewRouter.delete(
    '/delete/:reviewId',
    authUser, // Changed from adminAuth to authUser
    deleteReview
);

// Update the update review route to match the frontend request
reviewRouter.put(
    '/update/:reviewId',
    authUser,
    updateReview
);

// Get all reviews (Admin)
reviewRouter.get(
    '/all',
    adminAuth, // Middleware to authenticate admin
    getAllReviews
);


export default reviewRouter;
