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
    category: {
        type: String,
        required: true
    },
    subCategory: {
        type: String,
        required: true
    },
    sizes: {
        type: Array,
        required: true
    },
    bestseller: {
        type: Boolean
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
    }
});

const productModel = mongoose.models.Product || mongoose.model("Product", productSchema);

export default productModel;