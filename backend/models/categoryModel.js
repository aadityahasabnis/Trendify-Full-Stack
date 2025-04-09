import mongoose from "mongoose";

// Category Schema
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 🔥 Virtual: Subcategories in Category
categorySchema.virtual('subcategories', {
    ref: 'Subcategory',
    localField: '_id',
    foreignField: 'categoryId'
});


// Subcategory Schema
const subcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        lowercase: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound index
subcategorySchema.index({ slug: 1, categoryId: 1 }, { unique: true });

// ✅ Optional: Virtual for populated Category in Subcategory
subcategorySchema.virtual('category', {
    ref: 'Category',
    localField: 'categoryId',
    foreignField: '_id',
    justOne: true
});

// Model Exports
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Subcategory = mongoose.models.Subcategory || mongoose.model("Subcategory", subcategorySchema);

export { Category, Subcategory };
