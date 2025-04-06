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
});

// Middleware to handle cascading deletion of reviews
reviewSchema.pre("remove", async function (next) {
    try {
        // Ensure reviews are removed when the associated user or product is deleted
        await mongoose.model("Review").deleteMany({ userId: this.userId });
        await mongoose.model("Review").deleteMany({ productId: this.productId });
        next();
    } catch (err) {
        next(err);
    }
});

const reviewModel = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default reviewModel;