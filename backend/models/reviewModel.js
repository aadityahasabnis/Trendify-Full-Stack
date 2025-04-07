import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Reference to the Product model
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5, // Ratings between 1 and 5
    },
    comment: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now, // Automatically set the current date
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create a compound index to ensure a user can only review a product once
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Add virtuals for user and product data
reviewSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

reviewSchema.virtual('product', {
    ref: 'Product',
    localField: 'productId',
    foreignField: '_id',
    justOne: true
});

// Static method to calculate average rating for a product
reviewSchema.statics.calculateAverageRating = async function (productId) {
    const result = await this.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: "$productId",
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    return result.length > 0
        ? { averageRating: result[0].averageRating, reviewCount: result[0].reviewCount }
        : { averageRating: 0, reviewCount: 0 };
};

// Middleware to handle cascading deletion of reviews
reviewSchema.pre("remove", async function (next) {
    try {
        // This middleware runs when a single review document is removed
        next();
    } catch (err) {
        next(err);
    }
});

// Middleware to run after a review is saved or updated
reviewSchema.post('save', async function () {
    // Update the product's average rating
    await this.constructor.calculateAverageRating(this.productId);
});

// Middleware to run after a review is removed
reviewSchema.post('remove', async function () {
    // Update the product's average rating
    await this.constructor.calculateAverageRating(this.productId);
});

const reviewModel = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default reviewModel;