import jwt from 'jsonwebtoken';
import reviewModel from "../models/reviewModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

// Add a review (User)
const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        if (!productId || !rating || !comment) {
            return res.status(400).json({ success: false, message: "Product ID, rating, and comment are required" });
        }

        // Check if user has already reviewed this product
        const existingReview = await reviewModel.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: "You have already reviewed this product" });
        }

        const review = new reviewModel({
            userId,
            productId,
            rating,
            comment,
            date: new Date()
        });

        await review.save();

        res.status(201).json({
            success: true,
            message: "Review added successfully",
            review
        });
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ success: false, message: "Failed to add review" });
    }
};

// Get all reviews for a product (User/Admin)
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const reviewsRaw = await reviewModel.find({ productId })
            // Populate user but select name AND isBlocked status
            .populate({ path: 'userId', select: 'name isBlocked' })
            .sort({ date: -1 });

        // Filter out reviews from blocked users *after* fetching
        const reviews = reviewsRaw.filter(review => {
            // Keep review if user doesn't exist (e.g., deleted user) or if user exists and is NOT blocked
            return !review.userId || !review.userId.isBlocked;
        });

        res.json({
            success: true,
            reviews // Return the filtered list
        });
    } catch (error) {
        console.error("Error fetching product reviews:", error);
        res.status(500).json({ success: false, message: "Failed to fetch reviews" });
    }
};


// Update a review
const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId, rating, comment } = req.body;

        // Find and verify the review
        const review = await reviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Verify ownership
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to update this review" });
        }

        // Update the review
        const updatedReview = await reviewModel.findByIdAndUpdate(
            reviewId,
            { rating, comment },
            { new: true }
        ).populate('userId', 'name email');

        res.json({ success: true, review: updatedReview });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Delete a review (Admin/User)
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const isAdmin = decoded.isAdmin;

        const review = await reviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Check if user is admin or review owner
        if (!isAdmin && review.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this review" });
        }

        await reviewModel.findByIdAndDelete(reviewId);

        res.json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ success: false, message: "Failed to delete review" });
    }
};

// Get all reviews (Admin)
const getAllReviews = async (req, res) => {
    try {
        const reviews = await reviewModel.find().populate("userId", "name email").populate("productId", "name");

        if (reviews.length === 0) {
            return res.status(404).json({ success: false, message: "No reviews found" });
        }

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getProductReviewStats = async (req, res) => {
    try {
        const { productId } = req.params;

        // Validate productId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        // Convert productId to ObjectId
        const objectId = new mongoose.Types.ObjectId(productId);

        // Check if product exists
        const product = await productModel.findById(objectId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Aggregate reviews for the product
        const stats = await reviewModel.aggregate([
            { $match: { productId: objectId } },
            {
                $group: {
                    _id: "$productId",
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        // Return stats, even if no reviews exist
        return res.status(200).json({
            success: true,
            stats: stats.length > 0 ? stats[0] : {
                averageRating: 0,
                totalReviews: 0
            }
        });
    } catch (error) {
        console.error("Error in getProductReviewStats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch review stats" });
    }
};

// Get reviews by a specific user
const getUserReviews = async (req, res) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const reviews = await reviewModel.find({ userId })
            .populate('productId', 'name image price')
            .sort({ date: -1 });

        res.json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error("Error fetching user reviews:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user reviews" });
    }
};

export { getProductReviewStats, addReview, getProductReviews, deleteReview, getAllReviews, updateReview, getUserReviews };