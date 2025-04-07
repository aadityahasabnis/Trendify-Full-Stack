import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: Array,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
        required: true
    },
    sizes: {
        type: Array,
        required: true
    },
    bestseller: {
        type: Boolean,
        default: false
    },
    date: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    sales: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add virtual field for reviews
productSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'productId'
});

// Add virtual field to check if stock is available
productSchema.virtual('inStock').get(function () {
    return this.stock > 0 && this.isActive;
});

// Add virtual field to check if stock is low
productSchema.virtual('lowStock').get(function () {
    return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Add virtual field for stock display message
productSchema.virtual('stockMessage').get(function () {
    if (this.stock === 0) return "Out of stock";
    if (this.stock <= this.lowStockThreshold) return `Only ${this.stock} left in stock!`;
    return "In stock";
});

// Middleware to handle cascading deletion of related data
productSchema.pre('findOneAndDelete', async function (next) {
    try {
        const productId = this.getQuery()._id;

        // Delete all reviews for this product
        await mongoose.model('Review').deleteMany({ productId });

        next();
    } catch (error) {
        next(error);
    }
});

const productModel = mongoose.models.Product || mongoose.model("Product", productSchema);

export default productModel;