import jwt from 'jsonwebtoken';
import reviewModel from "../models/reviewModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

// Add a review (User)
const addReview = async (req, res) => {
    try {
        const { userId, productId, rating, comment } = req.body;

        // Validate user and product existence
        const user = await userModel.findById(userId);
        const product = await productModel.findById(productId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Create and save the review
        const newReview = new reviewModel({ userId, productId, rating, comment });
        await newReview.save();

        res.status(200).json({ success: true, message: "Review added successfully", review: newReview });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all reviews for a product (User/Admin)
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        // Convert to ObjectId
        const objectId = new mongoose.Types.ObjectId(productId);

        const reviews = await reviewModel
            .find({ productId: objectId })
            .populate("userId", "name email");

        if (reviews.length === 0) {
            return res.status(404).json({ success: false, message: "No reviews found for this product" });
        }

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
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
        const userId = req.body.userId; // From auth middleware

        const review = await reviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Check if the user owns the review
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this review" });
        }

        await reviewModel.findByIdAndDelete(reviewId);
        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
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

        // Aggregate reviews for the product
        const stats = await reviewModel.aggregate([
            { $match: { productId: objectId } }, // Match reviews for the specific product
            {
                $group: {
                    _id: "$productId",
                    averageRating: { $avg: "$rating" }, // Calculate average rating
                    totalReviews: { $sum: 1 }, // Count total reviews
                },
            },
        ]);

        if (stats.length === 0) {
            return res.status(404).json({ success: false, message: "No reviews found for this product" });
        }

        res.status(200).json({
            success: true,
            stats: stats[0], // Return the aggregated stats
        });
    } catch (error) {
        console.error("Error in getProductReviewStats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch review stats" });
    }
};

export { getProductReviewStats, addReview, getProductReviews, deleteReview, getAllReviews, updateReview };